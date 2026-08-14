package com.banking.accountservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Map;

@FeignClient(name = "transaction-service", url = "${transaction-service.url:http://localhost:8082}")
public interface TransactionServiceClient {

    @GetMapping("/api/v1/transactions/admin/all")
    List<Map<String, Object>> getAllTransactions();
}
