package com.banking.transactionservice.service;

import com.banking.transactionservice.client.AccountServiceClient;
import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.dto.TransferRequest;
import com.banking.transactionservice.event.TransactionCompletedEvent;
import com.banking.transactionservice.event.TransactionInitiatedEvent;
import com.banking.transactionservice.model.Transaction;
import com.banking.transactionservice.model.TransactionStatus;
import com.banking.transactionservice.model.TransactionType;
import com.banking.transactionservice.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountServiceClient accountServiceClient;

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String TRANSACTION_INITIATED_TOPIC = "transaction.initiated";
    private static final String TRANSACTION_COMPLETED_TOPIC = "transaction.completed";
    private static final String TRANSACTION_REFUNDED_TOPIC = "transaction.refunded";
    private static final String FRAUD_DETECTED_TOPIC = "fraud.detected";

    public TransactionResponse transfer(TransferRequest request) {

        log.info("SAGA START - Transfer: {} -> {} amount: {}",
                request.getSenderAccountNumber(),
                request.getReceiverAccountNumber(),
                request.getAmount());

        // SAGA STEP 1: Deduct from sender
        try {
            accountServiceClient.deductBalance(
                    request.getSenderAccountNumber(),
                    request.getAmount());
        } catch (feign.FeignException e) {
            log.error("Failed to deduct balance from account {}: {}", request.getSenderAccountNumber(), e.getMessage());
            String responseBody = e.contentUTF8();
            String errorMsg = "Transfer failed";
            if (responseBody != null && responseBody.contains("BLOCKED")) {
                errorMsg = "Account " + request.getSenderAccountNumber() + " is BLOCKED. Cannot initiate transfer.";
            } else if (responseBody != null && responseBody.contains("Insufficient balance")) {
                errorMsg = "Insufficient balance in account " + request.getSenderAccountNumber();
            } else if (e.getMessage() != null && e.getMessage().contains("BLOCKED")) {
                errorMsg = "Account " + request.getSenderAccountNumber() + " is BLOCKED. Cannot initiate transfer.";
            }
            throw new RuntimeException(errorMsg);
        }

        Transaction transaction = new Transaction();
        transaction.setSenderAccountNumber(request.getSenderAccountNumber());
        transaction.setReceiverAccountNumber(request.getReceiverAccountNumber());
        transaction.setAmount(request.getAmount());
        transaction.setType(TransactionType.TRANSFER);
        transaction.setStatus(TransactionStatus.PROCESSING);
        transaction.setDescription(request.getDescription());
        transaction.setReferenceNumber(UUID.randomUUID().toString());

        Transaction savedTransaction = transactionRepository.save(transaction);
        log.info("Transaction saved as PROCESSING: {}", savedTransaction.getId());

        // SAGA STEP - 2: Publish for fraud check
        TransactionInitiatedEvent event = new TransactionInitiatedEvent(
                savedTransaction.getId(),
                savedTransaction.getSenderAccountNumber(),
                savedTransaction.getReceiverAccountNumber(),
                savedTransaction.getAmount(),
                savedTransaction.getDescription());

        kafkaTemplate.send(TRANSACTION_INITIATED_TOPIC, savedTransaction.getId(), event);
        log.info("SAGA STEP 2 - TransactionInitiatedEvent published: {}", savedTransaction.getId());

        return mapToResponse(savedTransaction);
    }

    public TransactionResponse getTransaction(String transactionId) {
        return mapToResponse(transactionRepository
                .findById(transactionId)
                .orElseThrow(() -> new RuntimeException(
                        "Transaction not found: " + transactionId)));
    }

    public List<TransactionResponse> getTransactionHistory(String accountNumber) {
        return transactionRepository
                .findBySenderAccountNumberOrReceiverAccountNumberOrderByCreatedAtDesc(accountNumber, accountNumber)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getAllTransactions() {
        return transactionRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TransactionResponse verifyOTP(String transactionID, String otp) {
        log.info("OTP verification for transaction: {}", transactionID);

        Transaction transaction = transactionRepository.findById(transactionID)
                .orElseThrow(() -> new RuntimeException("Transaction not found " + transactionID));

        if (transaction.getStatus() == TransactionStatus.FLAGGED || 
            transaction.getStatus() == TransactionStatus.FAILED ||
            transaction.getStatus() == TransactionStatus.COMPLETED) {
            throw new RuntimeException("Transaction is already " + transaction.getStatus() + ". Cannot verify OTP.");
        }

        String otpKey = "verification:otp" + transactionID;
        String storedOtp = redisTemplate.opsForValue().get(otpKey);

        if (storedOtp == null) {
            log.warn("OTP expired for transaction: {}", transactionID);
            compensateTransaction(transaction, "OTP verification expired (5 min timeout) - amount refunded");
            throw new RuntimeException("OTP verification code expired or transaction already processed. Funds have been refunded.");
        }

        if (!storedOtp.equals(otp)) {
            String attemptsKey = "verification:attempts:" + transactionID;
            Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
            redisTemplate.expire(attemptsKey, 5, java.util.concurrent.TimeUnit.MINUTES);

            if (attempts >= 3) {
                log.warn("3 Wrong OTP attempts - blocking account and refunding: {}", transactionID);
                redisTemplate.delete(otpKey);
                redisTemplate.delete(attemptsKey);
                blockAccountAndCompensate(transaction,
                        "3 Invalid OTP attempts - transaction cancelled, account blocked for security");
                throw new RuntimeException("3 Invalid OTP attempts entered. Your account has been BLOCKED for security.");
            } else {
                long remaining = 3 - attempts;
                log.warn("Invalid OTP entered for {}. Attempts remaining: {}", transactionID, remaining);
                throw new RuntimeException("Invalid OTP code. You have " + remaining + " attempt(s) remaining.");
            }
        }

        // OTP correct - complete transaction
        log.info("OTP verified - completing transaction: {}", transactionID);
        redisTemplate.delete(otpKey);
        redisTemplate.delete("verification:attempts:" + transactionID);
        completeTransaction(transaction);
        return mapToResponse(transaction);
    }

    public TransactionResponse cancelTransaction(String transactionId) {
        log.info("User requested transaction cancellation for: {}", transactionId);
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));

        if (transaction.getStatus() == TransactionStatus.PENDING_VERIFICATION || transaction.getStatus() == TransactionStatus.PROCESSING) {
            String otpKey = "verification:otp" + transactionId;
            redisTemplate.delete(otpKey);
            compensateTransaction(transaction, "Transaction cancelled by user");
        }
        return mapToResponse(transaction);
    }

    @Scheduled(fixedRate = 60000)
    public void autoExpireAbandonedTransactions() {
        try {
            List<Transaction> pendingTxs = new ArrayList<>(transactionRepository.findByStatus(TransactionStatus.PENDING_VERIFICATION));
            pendingTxs.addAll(transactionRepository.findByStatus(TransactionStatus.PROCESSING));

            for (Transaction tx : pendingTxs) {
                String otpKey = "verification:otp" + tx.getId();
                String storedOtp = redisTemplate.opsForValue().get(otpKey);
                
                // If Redis TTL key expired or transaction created > 5 minutes ago
                if (storedOtp == null || (tx.getCreatedAt() != null && tx.getCreatedAt().isBefore(LocalDateTime.now().minusMinutes(5)))) {
                    log.warn("Auto-expiring abandoned transaction {}: OTP expired in Redis or Kafka outage timeout", tx.getId());
                    compensateTransaction(tx, "Transaction timeout / expired (5 min threshold) - amount refunded");
                }
            }
        } catch (Exception e) {
            log.warn("Error in scheduled auto-expire task: {}", e.getMessage());
        }
    }

    private void compensateTransaction(Transaction transaction, String reason) {
        log.warn("SAGA COMPENSATION - refunding: {} amount: {}",
                transaction.getSenderAccountNumber(),
                transaction.getAmount());

        // CREDIT MONEY BACK TO SENDER SYNCHRONOUSLY
        accountServiceClient.creditBalance(
                transaction.getSenderAccountNumber(),
                transaction.getAmount());

        transaction.setStatus(TransactionStatus.FLAGGED);
        transaction.setFailureReason(reason +
                " - SAGA Compensation executed, amount refunded at " + LocalDateTime.now());

        transactionRepository.save(transaction);

        // PUBLISH refund event - Notification service will alert user
        Map<String, Object> refundEvent = new HashMap<>();
        refundEvent.put("transactionId", transaction.getId());
        refundEvent.put("senderAccountNumber", transaction.getSenderAccountNumber());
        try {
            var acc = accountServiceClient.getAccount(transaction.getSenderAccountNumber());
            if (acc != null)
                refundEvent.put("email", acc.getEmail());
        } catch (Exception e) {
            log.warn("Failed to fetch email for refund event: {}", e.getMessage());
        }
        refundEvent.put("amount", transaction.getAmount());
        refundEvent.put("reason", reason);

        kafkaTemplate.send(TRANSACTION_REFUNDED_TOPIC, transaction.getId(), refundEvent);

        log.info("SAGA COMPENSATION COMPLETE - {} refunded to  {}",
                transaction.getAmount(), transaction.getSenderAccountNumber());
    }

    private void blockAccountAndCompensate(Transaction transaction, String reason) {
        log.warn("Fraud detected - Blocking account {} via Feign Client", transaction.getSenderAccountNumber());
        try {
            accountServiceClient.blockAccount(transaction.getSenderAccountNumber());
        } catch (Exception e) {
            log.error("Failed to block account via Feign client: {}", e.getMessage());
        }

        // Publish fraud.detected -> Notification Service will send email alert
        Map<String, Object> fraudEvent = new HashMap<>();
        fraudEvent.put("transactionId", transaction.getId());
        fraudEvent.put("accountNumber", transaction.getSenderAccountNumber());
        try {
            var acc = accountServiceClient.getAccount(transaction.getSenderAccountNumber());
            if (acc != null)
                fraudEvent.put("email", acc.getEmail());
        } catch (Exception e) {
            log.warn("Failed to fetch email for fraud event: {}", e.getMessage());
        }
        fraudEvent.put("reason", reason);

        kafkaTemplate.send(FRAUD_DETECTED_TOPIC, transaction.getSenderAccountNumber(), fraudEvent);
        log.warn("fraud.detected published - notification sent for account: {}", transaction.getSenderAccountNumber());

        // SAGA COMPENSATION - refund Sender
        compensateTransaction(transaction, reason);
    }

    private void completeTransaction(Transaction transaction) {
        transaction.setStatus(TransactionStatus.COMPLETED);
        transaction.setCompletedAt(LocalDateTime.now());
        transactionRepository.save(transaction);

        // SAGA STEP 2 - Credit receiver account
        log.info("SAGA Step 2 - Crediting receiver account {}: ₹{}",
                transaction.getReceiverAccountNumber(), transaction.getAmount());
        try {
            accountServiceClient.creditBalance(
                    transaction.getReceiverAccountNumber(),
                    transaction.getAmount());
        } catch (Exception e) {
            log.error("Failed to credit receiver account {}: {}",
                    transaction.getReceiverAccountNumber(), e.getMessage());
        }

        String senderEmail = null;
        String receiverEmail = null;
        try {
            var senderAcc = accountServiceClient.getAccount(transaction.getSenderAccountNumber());
            if (senderAcc != null)
                senderEmail = senderAcc.getEmail();
            var receiverAcc = accountServiceClient.getAccount(transaction.getReceiverAccountNumber());
            if (receiverAcc != null)
                receiverEmail = receiverAcc.getEmail();
        } catch (Exception e) {
            log.warn("Could not fetch account emails for notification: {}", e.getMessage());
        }

        TransactionCompletedEvent completedEvent = new TransactionCompletedEvent(
                transaction.getId(),
                transaction.getSenderAccountNumber(),
                transaction.getReceiverAccountNumber(),
                senderEmail,
                receiverEmail,
                transaction.getAmount(),
                transaction.getDescription());

        kafkaTemplate.send(TRANSACTION_COMPLETED_TOPIC, transaction.getId(), completedEvent);

        log.info("SAGA COMPLETE - Transaction {} completed",
                transaction.getId());
    }

    public void processCleanResult(String transactionID) {

        Transaction transaction = transactionRepository.findById(transactionID)
                .orElseThrow(() -> new RuntimeException(
                        "Transaction not found " + transactionID));

        if (transaction.getStatus() != TransactionStatus.PROCESSING) {
            log.warn("Transaction {} not PROCESSING - skipping", transactionID);
            return;
        }

        completeTransaction(transaction);
    }

    private TransactionResponse mapToResponse(Transaction transaction) {
        if (transaction == null) return null;
        TransactionResponse response = new TransactionResponse();
        response.setId(transaction.getId());
        response.setSenderAccountNumber(transaction.getSenderAccountNumber() != null ? transaction.getSenderAccountNumber() : "");
        response.setReceiverAccountNumber(transaction.getReceiverAccountNumber() != null ? transaction.getReceiverAccountNumber() : "");
        response.setAmount(transaction.getAmount() != null ? transaction.getAmount() : java.math.BigDecimal.ZERO);
        response.setType(transaction.getType() != null ? transaction.getType() : TransactionType.TRANSFER);
        response.setStatus(transaction.getStatus() != null ? transaction.getStatus() : TransactionStatus.PROCESSING);
        response.setDescription(transaction.getDescription() != null ? transaction.getDescription() : "");
        response.setReferenceNumber(transaction.getReferenceNumber() != null ? transaction.getReferenceNumber() : "");
        response.setFailureReason(transaction.getFailureReason());
        response.setCreatedAt(transaction.getCreatedAt() != null ? transaction.getCreatedAt() : LocalDateTime.now());
        response.setCompletedAt(transaction.getCompletedAt());

        return response;
    }

}
