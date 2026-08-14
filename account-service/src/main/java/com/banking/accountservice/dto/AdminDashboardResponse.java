package com.banking.accountservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdminDashboardResponse {
    private long totalUsers;
    private long totalAccounts;
    private long activeAccounts;
    private long blockedAccounts;
    private BigDecimal totalBankLiquidity;
    private long totalTransactions;
    private BigDecimal totalTransactionVolume;
    private long completedTransactions;
    private long failedTransactions;
    private List<Map<String, Object>> recentTransactions;
}
