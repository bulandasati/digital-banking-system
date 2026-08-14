package com.banking.authservice.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerifyOtpRequest {

    @JsonProperty("email")
    @NotBlank(message = "Email or Username is required")
    private String email;

    @JsonProperty("token")
    @NotBlank(message = "OTP code is required")
    private String token;
}
