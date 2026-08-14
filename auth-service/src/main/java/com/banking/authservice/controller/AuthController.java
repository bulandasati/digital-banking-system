package com.banking.authservice.controller;

import com.banking.authservice.dto.*;
import com.banking.authservice.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    private ResponseCookie createRefreshTokenCookie(String refreshToken, long maxAgeSeconds) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // Set to true in HTTPS production environments
                .path("/api/v1/auth")
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        log.info("REST request to register user: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        ResponseCookie cookie = createRefreshTokenCookie(response.getRefreshToken(), 7 * 24 * 60 * 60);

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        log.info("REST request to login user: {}", request.getEmailOrUsername());
        AuthResponse response = authService.login(request);
        ResponseCookie cookie = createRefreshTokenCookie(response.getRefreshToken(), 7 * 24 * 60 * 60);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        log.info("REST request to trigger password reset OTP for: {}", request.getEmail());
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<MessageResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        log.info("REST request to verify OTP for: {}", request.getEmail());
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        log.info("REST request to reset password for: {}", request.getEmail());
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshTokenRequest request) {
        log.info("REST request to refresh JWT token");
        
        String tokenToRefresh = (cookieRefreshToken != null && !cookieRefreshToken.isBlank())
                ? cookieRefreshToken
                : (request != null ? request.getRefreshToken() : null);

        if (tokenToRefresh == null || tokenToRefresh.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        RefreshTokenRequest refreshReq = new RefreshTokenRequest();
        refreshReq.setRefreshToken(tokenToRefresh);

        AuthResponse response = authService.refreshToken(refreshReq);
        ResponseCookie cookie = createRefreshTokenCookie(response.getRefreshToken(), 7 * 24 * 60 * 60);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @CookieValue(name = "refreshToken", required = false) String cookieRefreshToken,
            @RequestBody(required = false) RefreshTokenRequest request) {
        log.info("REST request to logout user session");
        
        String tokenToRevoke = (cookieRefreshToken != null && !cookieRefreshToken.isBlank())
                ? cookieRefreshToken
                : (request != null ? request.getRefreshToken() : null);

        if (tokenToRevoke != null) {
            authService.logout(tokenToRevoke);
        }

        ResponseCookie deleteCookie = createRefreshTokenCookie("", 0);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body("Logged out successfully");
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @RequestParam(required = false) String email) {
        String targetEmail = (userEmail != null && !userEmail.isBlank()) ? userEmail : email;
        if (targetEmail == null || targetEmail.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(authService.getUserProfileByEmail(targetEmail));
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }
}
