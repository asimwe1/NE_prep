package com.erp.erp_system.modules.deductions.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record DeductionRequest(
        @NotBlank String code,
        @NotBlank String name,
        @NotNull @DecimalMin("0.00") @DecimalMax("100.00") BigDecimal percentage,
        boolean active
) {
}
