package com.template.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

@Data
public class MeterReadingRequest {

    @NotNull(message = "Meter ID is required")
    private UUID meterId;

    @NotNull(message = "Current reading is required")
    @DecimalMin(value = "0.0", message = "Current reading must be non-negative")
    @Digits(integer = 10, fraction = 3, message = "Current reading must have at most 10 integer digits and 3 decimal places")
    private BigDecimal currentReading;

    @NotNull(message = "Reading date is required")
    @PastOrPresent(message = "Reading date must be today or in the past")
    private LocalDate readingDate;

    @NotNull(message = "Billing month is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM")
    private YearMonth billingMonth;
}
