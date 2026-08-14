package com.banking.accountservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@FeignClient(name = "auth-service", url = "${auth-service.url:http://localhost:8086}")
public interface AuthServiceClient {

    @GetMapping("/api/v1/auth/users")
    List<Map<String, Object>> getAllUsers();

    @GetMapping("/api/v1/auth/me")
    Map<String, Object> getUserByEmail(@RequestParam("email") String email);
}
