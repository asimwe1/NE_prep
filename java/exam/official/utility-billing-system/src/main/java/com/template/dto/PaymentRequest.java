package com.template.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PaymentRequest {

    @NotNull(message = "Bill ID is required")
    private UUID billId;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    @Digits(integer = 15, fraction = 2, message = "Amount must have at most 15 integer digits and 2 decimal places")
    private BigDecimal amount;

    @NotBlank(message = "Payment method is required")
    @Size(max = 50, message = "Payment method must not exceed 50 characters")
    private String paymentMethod;

    @NotBlank(message = "Payment reference is required")
    @Size(min = 6, max = 100, message = "Payment reference must be between 6 and 100 characters")
    @Pattern(regexp = "^[A-Z0-9\\-]+$", message = "Payment reference must contain only uppercase letters, digits, or hyphens")
    private String paymentReference;
}
