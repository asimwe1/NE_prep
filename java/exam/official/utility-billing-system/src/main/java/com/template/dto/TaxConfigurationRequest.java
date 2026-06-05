package com.template.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.template.entity.UtilityType;
import com.template.validation.ValidName;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.YearMonth;

@Data
public class TaxConfigurationRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @ValidName
    @Schema(example = "VAT 18 Water")
    private String name;

    @NotNull(message = "Rate is required")
    @DecimalMin(value = "0.0", message = "Rate must be non-negative")
    @DecimalMax(value = "100.0", message = "Rate must not exceed 100")
    @Schema(example = "18")
    private BigDecimal rate;

    @NotNull(message = "Utility type is required")
    @Schema(example = "WATER")
    private UtilityType utilityType;

    @NotNull(message = "Effective from is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM")
    @Schema(type = "string", pattern = "^\\d{4}-\\d{2}$", example = "2026-06", description = "Month when this tax configuration takes effect, in yyyy-MM format")
    private YearMonth effectiveFrom;
}
