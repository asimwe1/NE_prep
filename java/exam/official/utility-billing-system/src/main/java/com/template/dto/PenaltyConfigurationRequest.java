package com.template.dto;

import com.template.entity.UtilityType;
import com.template.validation.ValidName;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PenaltyConfigurationRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @ValidName
    private String name;

    @NotNull(message = "Rate is required")
    @DecimalMin(value = "0.0", message = "Rate must be non-negative")
    @DecimalMax(value = "100.0", message = "Rate must not exceed 100")
    private BigDecimal rate;

    @NotNull(message = "Grace period days is required")
    @Min(value = 0, message = "Grace period days must be non-negative")
    @Max(value = 365, message = "Grace period days must not exceed 365")
    private Integer gracePeriodDays;

    @NotNull(message = "Utility type is required")
    private UtilityType utilityType;
}
