package com.template.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TariffTierRequest {

    @NotNull(message = "Tier minimum is required")
    @DecimalMin(value = "0.0", message = "Tier minimum must be non-negative")
    private BigDecimal tierMin;

    @NotNull(message = "Tier maximum is required")
    @DecimalMin(value = "0.01", message = "Tier maximum must be greater than zero")
    private BigDecimal tierMax;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.01", message = "Unit price must be greater than zero")
    @Digits(integer = 10, fraction = 2, message = "Unit price must have at most 10 integer digits and 2 decimal places")
    private BigDecimal unitPrice;
}
