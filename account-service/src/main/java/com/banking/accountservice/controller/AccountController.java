package com.banking.accountservice.controller;

import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import com.banking.accountservice.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Slf4j
public class AccountController {

    private final AccountService accountService;

    // Create new bank account (supports POST /api/v1/accounts and POST /api/v1/accounts/create)
    @PostMapping({"", "/create"})
    public ResponseEntity<AccountResponse> createAccount(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail,
            @Valid @RequestBody CreateAccountRequest request) {
        
        log.info("Create account request received for userId: {} userEmail: {}", userId, userEmail);

        if (userId != null && !userId.isBlank() && (request.getUserId() == null || request.getUserId().isBlank())) {
            request.setUserId(userId);
        }
        if (userEmail != null && !userEmail.isBlank() && (request.getEmail() == null || request.getEmail().isBlank())) {
            request.setEmail(userEmail);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.createAccount(request));
    }

    // Get accounts for current authenticated user
    @GetMapping("/my-accounts")
    public ResponseEntity<java.util.List<AccountResponse>> getMyAccounts(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        log.info("Fetching my-accounts for userId: {} email: {}", userId, userEmail);
        return ResponseEntity.ok(accountService.getAccountsByUserIdOrEmail(userId, userEmail));
    }

    // Get all accounts (Admin endpoint)
    @GetMapping("/admin/all")
    public ResponseEntity<java.util.List<AccountResponse>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllAccounts());
    }

    // Get account details
    @GetMapping("/{accountNumber}")
    public ResponseEntity<AccountResponse> getAccount(
            @PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getAccount(accountNumber));
    }

    // Get account balance
    @GetMapping("/{accountNumber}/balance")
    public ResponseEntity<BigDecimal> getBalance(
            @PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getBalance(accountNumber));
    }

    // Block account
    @PutMapping("/{accountNumber}/block")
    public ResponseEntity<String> blockAccount(
            @PathVariable String accountNumber) {
        accountService.blockAccount(accountNumber);
        return ResponseEntity.ok("Account blocked successfully");
    }

    // Unblock account (Admin endpoint)
    @PutMapping("/{accountNumber}/unblock")
    public ResponseEntity<String> unblockAccount(
            @PathVariable String accountNumber) {
        accountService.unblockAccount(accountNumber);
        return ResponseEntity.ok("Account unblocked successfully");
    }

    @PutMapping("/{accountNumber}/deduct")
    public ResponseEntity<String> deductBalance(
            @PathVariable String accountNumber,
            @RequestParam BigDecimal amount) {
        accountService.deductBalance(accountNumber, amount);
        return ResponseEntity.ok("Balance deducted successfully");
    }

    @PutMapping("/{accountNumber}/credit")
    public ResponseEntity<String> creditBalance(
            @PathVariable String accountNumber,
            @RequestParam BigDecimal amount) {
        accountService.creditBalance(accountNumber, amount);
        return ResponseEntity.ok("Balance credited successfully");
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<java.util.Map<String, String>> handleRuntimeException(RuntimeException e) {
        log.error("Account API Exception: {}", e.getMessage());
        java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
        errorResponse.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
}
