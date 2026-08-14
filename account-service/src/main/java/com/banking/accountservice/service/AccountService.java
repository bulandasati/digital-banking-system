package com.banking.accountservice.service;

import com.banking.accountservice.client.AuthServiceClient;
import com.banking.accountservice.dto.AccountResponse;
import com.banking.accountservice.dto.CreateAccountRequest;
import com.banking.accountservice.model.Account;
import com.banking.accountservice.model.AccountStatus;
import com.banking.accountservice.model.AccountType;
import com.banking.accountservice.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountService {

    private final AccountRepository accountRepository;
    private final AuthServiceClient authServiceClient;
    private static SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        log.info("Creating {} account for request email: {} userId: {}", request.getAccountType(), request.getEmail(), request.getUserId());

        // Check if an account of this type already exists for the user (Limit: 1 SAVINGS, 1 CURRENT)
        if ((request.getUserId() != null && accountRepository.existsByUserIdAndAccountType(request.getUserId(), request.getAccountType()))
                || (request.getEmail() != null && accountRepository.existsByEmailAndAccountType(request.getEmail(), request.getAccountType()))) {
            throw new RuntimeException("You already hold a " + request.getAccountType() + " account. Maximum 1 SAVINGS and 1 CURRENT account allowed per customer.");
        }

        Account account = new Account();
        account.setAccountType(request.getAccountType());
        account.setStatus(AccountStatus.ACTIVE);
        account.setBalance(request.getInitialDeposit() != null ? request.getInitialDeposit() : BigDecimal.ZERO);
        account.setAccountNumber(generateAccountNumber());
        account.setDailyTransactionLimit(
                request.getAccountType() == AccountType.SAVINGS
                        ? new BigDecimal("100000")
                        : new BigDecimal("500000")
        );

        // Fetch real user profile via OpenFeign from auth-service
        String targetEmail = request.getEmail();
        if (targetEmail != null && !targetEmail.isBlank()) {
            try {
                log.info("Fetching real user profile via OpenFeign for email: {}", targetEmail);
                Map<String, Object> userMap = authServiceClient.getUserByEmail(targetEmail);
                if (userMap != null) {
                    if (userMap.get("id") != null) {
                        account.setUserId(String.valueOf(userMap.get("id")));
                    }
                    String fullName = (String) userMap.get("fullName");
                    String username = (String) userMap.get("username");
                    account.setAccountHolderName(fullName != null && !fullName.isBlank() ? fullName : username);
                    account.setEmail((String) userMap.get("email"));
                    account.setPhone((String) userMap.get("phone"));
                }
            } catch (Exception e) {
                log.warn("Could not fetch user profile via OpenFeign (fallback to request data): {}", e.getMessage());
            }
        }

        // Fallbacks if not set via OpenFeign
        if (account.getUserId() == null || account.getUserId().isBlank()) {
            account.setUserId(request.getUserId());
        }
        if (account.getEmail() == null || account.getEmail().isBlank()) {
            account.setEmail(request.getEmail());
        }
        if (account.getAccountHolderName() == null || account.getAccountHolderName().isBlank()) {
            account.setAccountHolderName(request.getAccountHolderName() != null ? request.getAccountHolderName() : "Customer");
        }
        if (account.getPhone() == null || account.getPhone().isBlank()) {
            account.setPhone(request.getPhone() != null ? request.getPhone() : "N/A");
        }

        Account saved = accountRepository.save(account);
        log.info("Account created successfully: {} for user: {}", saved.getAccountNumber(), saved.getAccountHolderName());
        return mapToResponse(saved);
    }

    public AccountResponse getAccount(String accountNumber) {
        Account account = findByAccountNumber(accountNumber);
        return mapToResponse(account);
    }

    public java.util.List<AccountResponse> getAccountsByUserIdOrEmail(String userId, String email) {
        java.util.List<Account> accounts = new java.util.ArrayList<>();
        if (userId != null && !userId.isBlank()) {
            accounts.addAll(accountRepository.findByUserId(userId));
        }
        if (accounts.isEmpty() && email != null && !email.isBlank()) {
            accounts.addAll(accountRepository.findByEmail(email));
        }
        return accounts.stream().map(this::mapToResponse).collect(java.util.stream.Collectors.toList());
    }

    public java.util.List<AccountResponse> getAllAccounts() {
        return accountRepository.findAll().stream().map(this::mapToResponse).collect(java.util.stream.Collectors.toList());
    }

    public BigDecimal getBalance(String accountNumber) {
        return findByAccountNumber(accountNumber).getBalance();
    }

    @Transactional
    public void blockAccount(String accountNumber) {
        log.info("Blocking account: {}", accountNumber);
        Account account = findByAccountNumber(accountNumber);
        account.setStatus(AccountStatus.BLOCKED);
        accountRepository.save(account);
        log.info("Account blocked: {}", accountNumber);
    }

    @Transactional
    public void unblockAccount(String accountNumber) {
        log.info("Unblocking account: {}", accountNumber);
        Account account = findByAccountNumber(accountNumber);
        account.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(account);
        log.info("Account unblocked: {}", accountNumber);
    }

    @Transactional
    public void deductBalance(String accountNumber, BigDecimal amount) {
        log.info("SAGA Step 1: Deducting ₹{} from account {}", amount, accountNumber);
        Account account = findByAccountNumber(accountNumber);
        if (account.getStatus() == AccountStatus.BLOCKED) {
            throw new RuntimeException("Account " + accountNumber + " is BLOCKED");
        }
        if (account.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance in account " + accountNumber);
        }
        account.setBalance(account.getBalance().subtract(amount));
        accountRepository.save(account);
        log.info("Balance deducted successfully. New balance: ₹{}", account.getBalance());
    }

    @Transactional
    public void creditBalance(String accountNumber, BigDecimal amount) {
        log.info("SAGA Step 2: Crediting ₹{} to account {}", amount, accountNumber);
        Account account = findByAccountNumber(accountNumber);
        account.setBalance(account.getBalance().add(amount));
        accountRepository.save(account);
        log.info("Balance credited successfully. New balance: ₹{}", account.getBalance());
    }

    @KafkaListener(topics = "payment.completed", groupId = "account-service-group")
    public void handlePaymentCompleted(@Payload Map<String, Object> event) {
        log.info("Received payment.completed event: {}", event);
        try {
            String accNo = (String) event.get("accountNumber");
            Object amtObj = event.get("amount");
            if (accNo != null && amtObj != null) {
                BigDecimal amount = new BigDecimal(amtObj.toString());
                creditBalance(accNo, amount);
                log.info("Kafka auto-credited ₹{} to account {}", amount, accNo);
            }
        } catch (Exception e) {
            log.error("Failed to process payment.completed event: {}", e.getMessage(), e);
        }
    }


    private Account findByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException("Account not found: " + accountNumber));
    }

    private String generateAccountNumber() {
        StringBuilder sb = new StringBuilder();
        sb.append(9); // Bank routing prefix 9
        for (int i = 0; i < 11; i++) {
            sb.append(secureRandom.nextInt(10));
        }
        return sb.toString();
    }

    private AccountResponse mapToResponse(Account account) {
        AccountResponse response = new AccountResponse();
        response.setId(account.getId());
        response.setAccountNumber(account.getAccountNumber());
        response.setUserId(account.getUserId());
        response.setAccountHolderName(account.getAccountHolderName());
        response.setEmail(account.getEmail());
        response.setPhone(account.getPhone());
        response.setAccountType(account.getAccountType());
        response.setStatus(account.getStatus());
        response.setBalance(account.getBalance());
        response.setDailyTransactionLimit(account.getDailyTransactionLimit());
        response.setCreatedAt(account.getCreatedAt());
        return response;
    }
}
