package com.banking.accountservice.controller;

import com.banking.accountservice.dto.AdminDashboardResponse;
import com.banking.accountservice.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboardMetrics() {
        log.info("GET /api/v1/admin/dashboard requested");
        return ResponseEntity.ok(adminService.getDashboardMetrics());
    }
}
