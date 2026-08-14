package com.banking.apigateway.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Component
@Slf4j
public class KeepAliveScheduler {

    private final WebClient webClient = WebClient.builder().build();

    @Value("${AUTH_SERVICE_URL:http://localhost:8086}")
    private String authServiceUrl;

    @Value("${ACCOUNT_SERVICE_URL:http://localhost:8081}")
    private String accountServiceUrl;

    @Value("${TRANSACTION_SERVICE_URL:http://localhost:8082}")
    private String transactionServiceUrl;

    @Value("${PAYMENT_SERVICE_URL:http://localhost:8083}")
    private String paymentServiceUrl;

    @Value("${FRAUD_DETECTION_SERVICE_URL:http://localhost:8084}")
    private String fraudServiceUrl;

    @Value("${NOTIFICATION_SERVICE_URL:http://localhost:8085}")
    private String notificationServiceUrl;

    // Ping all 6 microservices every 10 minutes (600,000 ms) to prevent Render 15-min idle sleep
    @Scheduled(fixedRate = 600000, initialDelay = 30000)
    public void keepAliveAllServices() {
        log.info("Starting Keep-Alive Heartbeat ping to all 6 microservices...");
        pingService("Auth Service", authServiceUrl);
        pingService("Account Service", accountServiceUrl);
        pingService("Transaction Service", transactionServiceUrl);
        pingService("Payment Service", paymentServiceUrl);
        pingService("Fraud Detection Service", fraudServiceUrl);
        pingService("Notification Service", notificationServiceUrl);
    }

    private void pingService(String serviceName, String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) return;
        String targetUrl = baseUrl.replaceAll("/+$", "") + "/actuator/health";
        webClient.get()
                .uri(targetUrl)
                .retrieve()
                .toBodilessEntity()
                .timeout(Duration.ofSeconds(10))
                .subscribe(
                        res -> log.info("Keep-Alive Heartbeat [{}]: UP ({})", serviceName, res.getStatusCode()),
                        err -> log.warn("Keep-Alive Heartbeat [{}]: Ping failed ({})", serviceName, err.getMessage())
                );
    }
}
