package com.banking.transactionservice.controller;

import com.banking.transactionservice.dto.TransactionResponse;
import com.banking.transactionservice.dto.TransferRequest;
import com.banking.transactionservice.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Slf4j
public class TransactionController {

    private final TransactionService transactionService;

    // Transfer money between accounts
    @PostMapping("/transfer")
    public ResponseEntity<TransactionResponse> transfer(
            @Valid @RequestBody TransferRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.transfer(request));
    }

    // Get transaction by ID
    @GetMapping("/{transactionId}")
    public ResponseEntity<TransactionResponse> getTransaction(
            @PathVariable String transactionId) {
        return ResponseEntity.ok(
                transactionService.getTransaction(transactionId));
    }

    // Get transaction history for account
    @GetMapping("/account/{accountNumber}")
    public ResponseEntity<List<TransactionResponse>> getHistory(
            @PathVariable String accountNumber) {
        return ResponseEntity.ok(
                transactionService.getTransactionHistory(accountNumber));
    }

    // Get all transactions across system (Admin endpoint)
    @GetMapping("/admin/all")
    public ResponseEntity<List<TransactionResponse>> getAllTransactions() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }


    @PostMapping("/{transactionId}/verify")
    public ResponseEntity<TransactionResponse> verifyTransaction(
            @PathVariable String transactionId,
            @RequestParam String otp) {
        log.info("OTP verification request — transaction: {}",
                transactionId);
        return ResponseEntity.ok(
                transactionService.verifyOTP(transactionId, otp));
    }

    @PostMapping("/{transactionId}/cancel")
    public ResponseEntity<TransactionResponse> cancelTransaction(
            @PathVariable String transactionId) {
        log.info("Transaction cancellation request — transaction: {}", transactionId);
        return ResponseEntity.ok(transactionService.cancelTransaction(transactionId));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<java.util.Map<String, String>> handleRuntimeException(RuntimeException e) {
        log.error("Transaction API Exception: {}", e.getMessage());
        java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
        errorResponse.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
}
