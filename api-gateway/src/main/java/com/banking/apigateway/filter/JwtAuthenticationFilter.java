package com.banking.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;
import java.util.List;

@Component
@Slf4j
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final List<String> PUBLIC_ENDPOINTS = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/refresh",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/verify-otp",
            "/api/v1/auth/reset-password",
            "/api/v1/payments/webhook",
            "/actuator/**"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. Bypass OPTIONS preflight & public endpoints
        if (request.getMethod() == org.springframework.http.HttpMethod.OPTIONS || isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // 2. Check Authorization Header
        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            log.warn("Missing Authorization header for request: {}", path);
            return onError(exchange, "Missing Authorization header", HttpStatus.UNAUTHORIZED);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Invalid Authorization header format for request: {}", path);
            return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);

        // 3. Validate Token & Extract Claims
        try {
            Claims claims = parseClaims(token);
            String userId = claims.get("userId", String.class);
            String email = claims.getSubject();
            String role = claims.get("role", String.class);

            // 4. Role Enforcement for Admin Endpoints
            if (isAdminPath(path) && !"ROLE_ADMIN".equalsIgnoreCase(role)) {
                log.warn("Forbidden access attempt by user {} (role {}) to admin path: {}", email, role, path);
                return onError(exchange, "Forbidden: Admin privilege required", HttpStatus.FORBIDDEN);
            }

            // 5. Inject X-User-* Headers downstream
            ServerHttpRequest mutatedRequest = request.mutate()
                    .header("X-User-Id", userId != null ? userId : "")
                    .header("X-User-Email", email != null ? email : "")
                    .header("X-User-Role", role != null ? role : "")
                    .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (Exception e) {
            log.error("JWT Validation failed for path {}: {}", path, e.getMessage());
            return onError(exchange, "Invalid or expired JWT token", HttpStatus.UNAUTHORIZED);
        }
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_ENDPOINTS.stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private boolean isAdminPath(String path) {
        return path.contains("/admin") || path.endsWith("/unblock");
    }

    private Claims parseClaims(String token) {
        Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        return response.setComplete();
    }

    @Override
    public int getOrder() {
        return 0; // Execute after CorsWebFilter
    }
}
