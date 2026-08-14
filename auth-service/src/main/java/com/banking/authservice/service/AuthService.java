package com.banking.authservice.service;

import com.banking.authservice.dto.*;
import com.banking.authservice.model.RefreshToken;
import com.banking.authservice.model.Role;
import com.banking.authservice.model.User;
import com.banking.authservice.repository.RefreshTokenRepository;
import com.banking.authservice.repository.UserRepository;
import com.banking.authservice.security.JwtUtils;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final StringRedisTemplate redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Autowired(required = false)
    private KafkaTemplate<String, Object> kafkaTemplate;

    private static final String OTP_PREFIX = "reset_otp:";
    private static final long OTP_EXPIRATION_MINUTES = 15;
    private static final String PASSWORD_RESET_KAFKA_TOPIC = "auth.password.reset.otp";

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.email:admin@digitalbank.com}")
    private String adminEmail;

    @Value("${app.admin.password:AdminPass123!}")
    private String adminPassword;

    @Value("${app.admin.fullName:System Administrator}")
    private String adminFullName;

    @PostConstruct
    public void initDefaultAdmin() {
        if (!userRepository.existsByEmail(adminEmail) && !userRepository.existsByUsername(adminUsername)) {
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setFullName(adminFullName);
            admin.setPhone("1800000000");
            admin.setRole(Role.ROLE_ADMIN);
            userRepository.save(admin);
            log.info("👑 Admin user seeded: {}", adminEmail);
        }
    }

    private RefreshToken saveRefreshToken(User user, String tokenStr) {
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(tokenStr);
        token.setExpiryDate(Instant.now().plus(7, ChronoUnit.DAYS));
        token.setRevoked(false);
        return refreshTokenRepository.save(token);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email '" + request.getEmail() + "' is already registered");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole() != null ? request.getRole() : Role.ROLE_USER);

        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getEmail());

        String accessToken = jwtUtils.generateAccessToken(savedUser);
        String refreshTokenStr = jwtUtils.generateRefreshToken(savedUser);
        saveRefreshToken(savedUser, refreshTokenStr);

        return new AuthResponse(accessToken, refreshTokenStr, mapToUserResponse(savedUser));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmailOrUsername())
                .orElseGet(() -> userRepository.findByUsername(request.getEmailOrUsername())
                        .orElseThrow(() -> new RuntimeException("Invalid username/email or password")));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username/email or password");
        }

        log.info("User logged in successfully: {}", user.getEmail());

        String accessToken = jwtUtils.generateAccessToken(user);
        String refreshTokenStr = jwtUtils.generateRefreshToken(user);
        saveRefreshToken(user, refreshTokenStr);

        return new AuthResponse(accessToken, refreshTokenStr, mapToUserResponse(user));
    }

    public MessageResponse   forgotPassword(ForgotPasswordRequest request) {
        String input = request.getEmail().trim();
        User user = userRepository.findByEmail(input)
                .orElseGet(() -> userRepository.findByUsername(input)
                        .orElseThrow(() -> new RuntimeException("No account registered with email or username: " + input)));

        // Generate 6-digit OTP
        String otp = String.format("%06d", new SecureRandom().nextInt(900000) + 100000);
        String redisKey = OTP_PREFIX + user.getEmail();

        // 1. Store OTP in Redis with 15-minute TTL
        redisTemplate.opsForValue().set(redisKey, otp, OTP_EXPIRATION_MINUTES, TimeUnit.MINUTES);
        log.info("🔑 Stored Redis OTP [{}] with 15m TTL for user {}", otp, user.getEmail());

        // 2. Publish Kafka Event for notification-service to consume & send mail
        publishPasswordResetKafkaEvent(user.getEmail(), otp);

        return new MessageResponse("Password reset OTP dispatched to your registered email (" + user.getEmail() + ")");
    }

    private void publishPasswordResetKafkaEvent(String email, String otp) {
        if (kafkaTemplate == null) {
            log.warn("⚠️ KafkaTemplate not configured. Skipping Kafka event publication for OTP.");
            return;
        }
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("email", email);
            event.put("otp", otp);
            event.put("timestamp", LocalDateTime.now().toString());

            kafkaTemplate.send(PASSWORD_RESET_KAFKA_TOPIC, email, event);
            log.info("📡 Published Password Reset OTP Kafka Event to topic [{}] for user: {}", PASSWORD_RESET_KAFKA_TOPIC, email);
        } catch (Exception e) {
            log.error("⚠️ Failed to publish Kafka event for OTP: {}", e.getMessage());
        }
    }

    public MessageResponse verifyOtp(VerifyOtpRequest request) {
        String input = request.getEmail().trim();
        User user = userRepository.findByEmail(input)
                .orElseGet(() -> userRepository.findByUsername(input)
                        .orElseThrow(() -> new RuntimeException("No account registered with email or username: " + input)));

        String redisKey = OTP_PREFIX + user.getEmail();
        String storedOtp = redisTemplate.opsForValue().get(redisKey);

        if (storedOtp == null) {
            throw new RuntimeException("OTP code has expired or does not exist. Please request a new OTP.");
        }

        if (!storedOtp.equals(request.getToken().trim())) {
            throw new RuntimeException("Invalid OTP code. Please check and try again.");
        }

        log.info("✅ Redis OTP verified successfully for user {}", user.getEmail());
        return new MessageResponse("OTP verified successfully!");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        String input = request.getEmail().trim();
        User user = userRepository.findByEmail(input)
                .orElseGet(() -> userRepository.findByUsername(input)
                        .orElseThrow(() -> new RuntimeException("No account registered with email or username: " + input)));

        String redisKey = OTP_PREFIX + user.getEmail();
        String storedOtp = redisTemplate.opsForValue().get(redisKey);

        if (storedOtp == null || !storedOtp.equals(request.getToken().trim())) {
            throw new RuntimeException("Invalid or expired OTP code. Please request a new password reset.");
        }

        // Encode and update new password in database
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Consume (delete) OTP key from Redis
        redisTemplate.delete(redisKey);

        log.info("🔐 Password updated successfully for user {} via Redis OTP", user.getEmail());
        return new MessageResponse("Password updated successfully!");
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();
        if (tokenStr == null || !jwtUtils.validateJwtToken(tokenStr)) {
            throw new RuntimeException("Invalid or expired JWT signature");
        }

        RefreshToken refreshTokenEntity = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new RuntimeException("Refresh token record not found in database"));

        if (refreshTokenEntity.isRevoked() || refreshTokenEntity.getExpiryDate().isBefore(Instant.now())) {
            log.warn("⚠️ Attempted use of revoked/expired refresh token!");
            throw new RuntimeException("Refresh token has been explicitly revoked or expired");
        }

        refreshTokenEntity.setRevoked(true);
        refreshTokenRepository.save(refreshTokenEntity);

        User user = refreshTokenEntity.getUser();
        String newAccessToken = jwtUtils.generateAccessToken(user);
        String newRefreshTokenStr = jwtUtils.generateRefreshToken(user);
        saveRefreshToken(user, newRefreshTokenStr);

        return new AuthResponse(newAccessToken, newRefreshTokenStr, mapToUserResponse(user));
    }

    @Transactional
    public void logout(String tokenStr) {
        if (tokenStr != null && !tokenStr.isBlank()) {
            refreshTokenRepository.findByToken(tokenStr).ifPresent(tokenEntity -> {
                tokenEntity.setRevoked(true);
                refreshTokenRepository.save(tokenEntity);
                log.info("🔒 Refresh token explicitly revoked on logout for user: {}", tokenEntity.getUser().getEmail());
            });
        }
    }

    public UserResponse getUserProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return mapToUserResponse(user);
    }

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
