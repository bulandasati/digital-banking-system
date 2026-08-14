package com.banking.accountservice.dto;

import com.banking.accountservice.model.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateAccountRequest {

    private String userId;
    private String accountHolderName;
    private String email;
    private String phone;

    @NotNull(message = "Account type is required")
    private AccountType accountType;

    private BigDecimal initialDeposit;
}
