package com.banking.paymentservice.config;

import org.springframework.context.annotation.Configuration;

// CORS is centrally handled by api-gateway CorsConfig.
// Downstream microservices do not declare CORS to avoid duplicate header conflicts.
@Configuration
public class CorsConfig {
}
