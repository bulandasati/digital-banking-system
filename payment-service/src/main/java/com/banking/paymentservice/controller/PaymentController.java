package com.banking.paymentservice.controller;

import com.banking.paymentservice.dto.CreatePaymentRequest;
import com.banking.paymentservice.dto.PaymentOrderResponse;
import com.banking.paymentservice.service.PaymentService;
import com.razorpay.RazorpayException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final PaymentService paymentService;

    // Create Razorpay payment order
    @PostMapping("/create-order")
    public ResponseEntity<PaymentOrderResponse> createPaymentOrder(
            @Valid @RequestBody CreatePaymentRequest request)
            throws RazorpayException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.createPaymentOrder(request));
    }

    // Verify payment signature from client callback
    @PostMapping("/verify")
    public ResponseEntity<String> verifyPayment(
            @RequestBody Map<String, String> data) {
        boolean isVerified = paymentService.verifyPayment(data);
        if (isVerified) {
            return ResponseEntity.ok("Payment verified and completed successfully");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payment signature");
        }
    }

    // Get payment status by ID
    @GetMapping("/{paymentId}")
    public ResponseEntity<com.banking.paymentservice.model.Payment> getPayment(
            @PathVariable String paymentId) {
        return ResponseEntity.ok(paymentService.getPayment(paymentId));
    }

    // Razorpay webhook endpoint
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody Map<String, Object> payload) {
        log.info("Webhook received from Razorpay");
        paymentService.handleWebhook(payload);
        return ResponseEntity.ok("Webhook processed");
    }
}
