package com.banking.authservice.dto;

import com.banking.authservice.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private Role role;
    private LocalDateTime createdAt;
}
