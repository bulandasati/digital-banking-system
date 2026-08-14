package com.banking.accountservice.service;

import com.banking.accountservice.client.AuthServiceClient;
import com.banking.accountservice.client.TransactionServiceClient;
import com.banking.accountservice.dto.AdminDashboardResponse;
import com.banking.accountservice.model.Account;
import com.banking.accountservice.model.AccountStatus;
import com.banking.accountservice.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final AccountRepository accountRepository;
    private final AuthServiceClient authServiceClient;
    private final TransactionServiceClient transactionServiceClient;

    public AdminDashboardResponse getDashboardMetrics() {
        log.info("Calculating system-wide Admin Dashboard metrics via Feign Clients");

        long totalUsers = 0;
        try {
            List<Map<String, Object>> users = authServiceClient.getAllUsers();
            if (users != null) totalUsers = users.size();
        } catch (Exception e) {
            log.warn("Could not fetch users count from auth-service via Feign: {}", e.getMessage());
        }

        List<Account> allAccounts = accountRepository.findAll();
        long totalAccounts = allAccounts.size();
        long activeAccounts = allAccounts.stream()
                .filter(a -> a.getStatus() == AccountStatus.ACTIVE)
                .count();
        long blockedAccounts = allAccounts.stream()
                .filter(a -> a.getStatus() == AccountStatus.BLOCKED)
                .count();

        BigDecimal totalBankLiquidity = allAccounts.stream()
                .map(Account::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalTransactions = 0;
        BigDecimal totalVolume = BigDecimal.ZERO;
        long completedTransactions = 0;
        long failedTransactions = 0;
        List<Map<String, Object>> recentTxList = new ArrayList<>();

        try {
            List<Map<String, Object>> transactions = transactionServiceClient.getAllTransactions();
            if (transactions != null) {
                totalTransactions = transactions.size();
                recentTxList = transactions.stream().limit(10).collect(Collectors.toList());
                for (Map<String, Object> tx : transactions) {
                    String status = (String) tx.get("status");
                    Object amountObj = tx.get("amount");
                    if ("COMPLETED".equalsIgnoreCase(status)) {
                        completedTransactions++;
                        if (amountObj != null) {
                            totalVolume = totalVolume.add(new BigDecimal(amountObj.toString()));
                        }
                    } else if ("FAILED".equalsIgnoreCase(status)) {
                        failedTransactions++;
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch transaction metrics from transaction-service via Feign: {}", e.getMessage());
        }

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalAccounts(totalAccounts)
                .activeAccounts(activeAccounts)
                .blockedAccounts(blockedAccounts)
                .totalBankLiquidity(totalBankLiquidity)
                .totalTransactions(totalTransactions)
                .totalTransactionVolume(totalVolume)
                .completedTransactions(completedTransactions)
                .failedTransactions(failedTransactions)
                .recentTransactions(recentTxList)
                .build();
    }
}
