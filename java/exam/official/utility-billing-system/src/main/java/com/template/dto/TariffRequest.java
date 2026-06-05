package com.template.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.template.entity.BillingMode;
import com.template.entity.TariffType;
import com.template.entity.UtilityType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

@Data
public class TariffRequest {

    @NotBlank(message = "Tariff code is required")
    @Size(min = 3, max = 30, message = "Tariff code must be between 3 and 30 characters")
    @Pattern(regexp = "^[A-Z0-9_\\-]+$", message = "Tariff code must contain only uppercase letters, digits, underscores, or hyphens")
    @Schema(example = "WATER_POSTPAID_STD_202606_V1", description = "Unique tariff code using uppercase letters, digits, underscores, or hyphens")
    private String tariffCode;

    @NotNull(message = "Utility type is required")
    @Schema(example = "WATER")
    private UtilityType utilityType;

    @NotNull(message = "Billing mode is required")
    @Schema(example = "POSTPAID")
    private BillingMode billingMode;

    @NotNull(message = "Tariff type is required")
    @Schema(example = "TIER_BASED")
    private TariffType tariffType;

    @NotNull(message = "Version is required")
    @Min(value = 1, message = "Version must be at least 1")
    @Schema(example = "1")
    private Integer version;

    @NotNull(message = "Effective start cycle is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM")
    @Schema(type = "string", pattern = "^\\d{4}-\\d{2}$", example = "2026-06", description = "First billing cycle when this tariff becomes active, in yyyy-MM format")
    private YearMonth effectiveStartCycle;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM")
    @Schema(type = "string", pattern = "^\\d{4}-\\d{2}$", example = "2026-12", description = "Last billing cycle when this tariff remains active, in yyyy-MM format")
    private YearMonth effectiveEndCycle;

    @NotNull(message = "Fixed service charge is required")
    @DecimalMin(value = "0.0", message = "Fixed service charge must be non-negative")
    @Digits(integer = 12, fraction = 2, message = "Fixed service charge must have at most 12 integer digits and 2 decimal places")
    @Schema(example = "500")
    private BigDecimal fixedServiceCharge;

    @NotNull(message = "VAT rate is required")
    @DecimalMin(value = "0.0", message = "VAT rate must be non-negative")
    @DecimalMax(value = "100.0", message = "VAT rate must not exceed 100")
    @Digits(integer = 3, fraction = 2, message = "VAT rate must have at most 3 integer digits and 2 decimal places")
    @Schema(example = "18")
    private BigDecimal vatRate;

    @Valid
    @Schema(description = "Required for TIER_BASED tariffs; optional for FLAT tariffs")
    private List<TariffTierRequest> tiers;
}
