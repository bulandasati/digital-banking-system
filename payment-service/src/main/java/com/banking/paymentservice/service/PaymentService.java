package com.banking.paymentservice.service;

import com.banking.paymentservice.dto.CreatePaymentRequest;
import com.banking.paymentservice.dto.PaymentOrderResponse;
import com.banking.paymentservice.model.Payment;
import com.banking.paymentservice.model.PaymentStatus;
import com.banking.paymentservice.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    private static final String PAYMENT_COMPLETED_TOPIC = "payment.completed";
    private static final String PAYMENT_FAILED_TOPIC = "payment.failed";

    public PaymentOrderResponse createPaymentOrder(
            CreatePaymentRequest request) throws RazorpayException {

        log.info("Creating payment order for account: {} amount: {}",
                request.getAccountNumber(), request.getAmount());

        RazorpayClient razorpay = new RazorpayClient(keyId, keySecret);

        int amountInPaise = request.getAmount()
                .multiply(BigDecimal.valueOf(100))
                .intValue();

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountInPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "rcpt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 20));

        Order razorpayOrder = razorpay.orders.create(orderRequest);
        String razorpayOrderId = razorpayOrder.get("id").toString();
        log.info("Razorpay order created: {}", razorpayOrderId);

        Payment payment = new Payment();
        payment.setRazorpayOrderId(razorpayOrderId);
        payment.setAccountNumber(request.getAccountNumber());
        payment.setEmail(request.getEmail());
        payment.setAmount(request.getAmount());
        payment.setCurrency("INR");
        payment.setStatus(PaymentStatus.CREATED);
        payment.setDescription(request.getDescription());

        Payment saved = paymentRepository.save(payment);

        return new PaymentOrderResponse(
                saved.getId(),
                razorpayOrderId,
                request.getAmount(),
                "INR",
                keyId,
                "CREATED"
        );
    }

    public boolean verifyPayment(Map<String, String> data) {
        String orderId = data.get("razorpay_order_id");
        String paymentId = data.get("razorpay_payment_id");
        String signature = data.get("razorpay_signature");

        log.info("Verifying Razorpay payment signature for orderId: {} paymentId: {}", orderId, paymentId);

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);

            boolean isValid = Utils.verifyPaymentSignature(options, keySecret);

            if (isValid) {
                processPaymentSuccess(orderId, paymentId);
                return true;
            } else {
                log.warn("Invalid Razorpay HMAC signature for order: {}", orderId);
                processPaymentFailure(orderId, "Invalid Razorpay HMAC signature");
            }
        } catch (Exception e) {
            log.error("Error during payment signature verification: {}", e.getMessage(), e);
            processPaymentFailure(orderId, e.getMessage());
        }
        return false;
    }

    public void handleWebhook(Map<String, Object> payload) {
        log.info("Received Razorpay webhook event: {}", payload.get("event"));

        String event = (String) payload.get("event");
        Map<String, Object> paymentData = extractPaymentData(payload);
        if (paymentData != null) {
            String orderId = (String) paymentData.get("order_id");
            String paymentId = (String) paymentData.get("id");

            if ("payment.captured".equals(event)) {
                processPaymentSuccess(orderId, paymentId);
            } else if ("payment.failed".equals(event)) {
                processPaymentFailure(orderId, "Payment failed via Razorpay Webhook");
            }
        }
    }

    public void processPaymentSuccess(String orderId, String paymentId) {
        log.info("Processing payment success for order: {}", orderId);
        Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        payment.setRazorpayPaymentId(paymentId);
        payment.setStatus(PaymentStatus.COMPLETED);
        Payment saved = paymentRepository.save(payment);

        // Publish payment.completed event to Kafka
        Map<String, Object> event = new HashMap<>();
        event.put("paymentId", saved.getId());
        event.put("accountNumber", saved.getAccountNumber());
        if (saved.getEmail() != null) event.put("email", saved.getEmail());
        event.put("amount", saved.getAmount());
        event.put("razorpayPaymentId", paymentId);

        kafkaTemplate.send(PAYMENT_COMPLETED_TOPIC, saved.getId(), event);

        log.info("Payment completed successfully: {} for account: {}", saved.getId(), saved.getAccountNumber());
    }

    public void processPaymentFailure(String orderId, String reason) {
        log.warn("Processing payment failure for order: {} reason: {}", orderId, reason);
        Payment payment = paymentRepository.findByRazorpayOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        payment.setStatus(PaymentStatus.FAILED);
        payment.setFailureReason(reason);
        paymentRepository.save(payment);

        // Publish payment.failed event to Kafka
        Map<String, Object> event = new HashMap<>();
        event.put("paymentId", payment.getId());
        event.put("accountNumber", payment.getAccountNumber());
        if (payment.getEmail() != null) event.put("email", payment.getEmail());
        event.put("amount", payment.getAmount());
        event.put("reason", reason);

        kafkaTemplate.send(PAYMENT_FAILED_TOPIC, payment.getId(), event);

        log.warn("Payment marked as FAILED: {}", payment.getId());
    }

    public Payment getPayment(String paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractPaymentData(Map<String, Object> payload) {
        try {
            Map<String, Object> entity = (Map<String, Object>) payload.get("payload");
            Map<String, Object> paymentWrapper = (Map<String, Object>) entity.get("payment");
            return (Map<String, Object>) paymentWrapper.get("entity");
        } catch (Exception e) {
            log.error("Failed to extract payment data from webhook payload: {}", e.getMessage());
            return null;
        }
    }
}
