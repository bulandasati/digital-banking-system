package com.banking.transactionservice.service;

import com.banking.transactionservice.model.Transaction;
import com.banking.transactionservice.model.TransactionStatus;
import com.banking.transactionservice.model.TransactionType;
import com.banking.transactionservice.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class TransactionEventConsumer {

    private final TransactionRepository transactionRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final TransactionService transactionService;
    private final com.banking.transactionservice.client.AccountServiceClient accountServiceClient;
    private static final long OTP_EXPIRY_MINUTES = 5;

    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TRANSACTION_OTP_GENERATED_TOPIC = "transaction.otp.generated";

    @KafkaListener(topics = "verification.required")
    public void consumeVerificationRequired(
            @Payload Map<String, Object> payload){

        try{

            String transactionId =  (String) payload.get("transactionId");
            String accountNumber = (String) payload.get("accountNumber");
            String reason =  (String) payload.get("reason");

            log.info("Verification required - transaction: {} reason: {}",
                    transactionId, reason);

            Transaction transaction = transactionRepository.findById(transactionId)
                    .orElseThrow(() -> new RuntimeException(
                            "Transaction not found " + transactionId
                    ));

            if(transaction.getStatus() != TransactionStatus.PROCESSING){
                log.warn("Transaction {} not PROCESSING - skipping", transactionId);
                return;
            }

            // Generate 6 digit otp
            String otp = String.format("%06d", (int) (Math.random() * 900000) + 100000);

            // Store OTP in Redis - expires in 5 minutes
            String otpKey = "verification:otp" + transactionId;
            redisTemplate.opsForValue().set(otpKey, otp, OTP_EXPIRY_MINUTES, TimeUnit.MINUTES);

            // Update Status
            transaction.setStatus(TransactionStatus.PENDING_VERIFICATION);
            transactionRepository.save(transaction);

            log.info("OTP generated for transaction: {} expires in {} min",
                    transactionId, OTP_EXPIRY_MINUTES);

            // Notify user
            Map<String, Object> otpEvent = new HashMap<>();
            otpEvent.put("transactionId", transactionId);
            otpEvent.put("accountNumber", accountNumber);
            try {
                var acc = accountServiceClient.getAccount(accountNumber);
                if (acc != null) otpEvent.put("email", acc.getEmail());
            } catch (Exception e) {
                log.warn("Failed to fetch email for OTP event: {}", e.getMessage());
            }
            otpEvent.put("reason", reason);
            otpEvent.put("otp", otp);
            otpEvent.put("amount", payload.get("amount"));

            kafkaTemplate.send(TRANSACTION_OTP_GENERATED_TOPIC, transactionId, otpEvent);

        }
        catch(Exception e){
            log.error("Error handling verification required: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "fraud.check.clean")
    public void consumeFraudCheckCleanResult(
            @Payload Map<String, Object> payload){

        try{

            String transactionId =  (String) payload.get("transactionId");
            transactionService.processCleanResult(transactionId);
        }
        catch(Exception e){
            log.error("Error processing fraud check result: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = "payment.completed")
    public void consumePaymentCompleted(@Payload Map<String, Object> payload) {
        try {
            log.info("Recording completed payment deposit in transaction service: {}", payload);
            String accountNumber = (String) payload.get("accountNumber");
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());
            String razorpayPaymentId = (String) payload.get("razorpayPaymentId");

            Transaction transaction = new Transaction();
            transaction.setSenderAccountNumber("RAZORPAY_GATEWAY");
            transaction.setReceiverAccountNumber(accountNumber);
            transaction.setAmount(amount);
            transaction.setType(TransactionType.DEPOSIT);
            transaction.setStatus(TransactionStatus.COMPLETED);
            transaction.setDescription("Razorpay Instant Deposit");
            transaction.setReferenceNumber(razorpayPaymentId != null ? razorpayPaymentId : "DEP_" + System.currentTimeMillis());
            transaction.setCompletedAt(LocalDateTime.now());

            transactionRepository.save(transaction);
            log.info("Saved DEPOSIT transaction entry for account {} amount ₹{}", accountNumber, amount);
        } catch (Exception e) {
            log.error("Error processing payment.completed event in transaction-service: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "payment.failed")
    public void consumePaymentFailed(@Payload Map<String, Object> payload) {
        try {
            log.info("Recording failed payment deposit in transaction service: {}", payload);
            String accountNumber = (String) payload.get("accountNumber");
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());
            String reason = (String) payload.get("reason");

            Transaction transaction = new Transaction();
            transaction.setSenderAccountNumber("RAZORPAY_GATEWAY");
            transaction.setReceiverAccountNumber(accountNumber);
            transaction.setAmount(amount);
            transaction.setType(TransactionType.DEPOSIT);
            transaction.setStatus(TransactionStatus.FAILED);
            transaction.setFailureReason(reason != null ? reason : "Payment Failed via Razorpay Gateway");
            transaction.setDescription("Failed Deposit Attempt");
            transaction.setReferenceNumber("FAIL_" + System.currentTimeMillis());

            transactionRepository.save(transaction);
            log.info("Saved FAILED DEPOSIT transaction entry for account {}", accountNumber);
        } catch (Exception e) {
            log.error("Error processing payment.failed event in transaction-service: {}", e.getMessage(), e);
        }
    }
}
