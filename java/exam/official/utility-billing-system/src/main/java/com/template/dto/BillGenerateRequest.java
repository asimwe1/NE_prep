package com.template.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.YearMonth;
import java.util.UUID;

@Data
public class BillGenerateRequest {

    @NotNull(message = "Meter ID is required")
    private UUID meterId;

    @NotNull(message = "Billing month is required")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM")
    @Schema(type = "string", pattern = "^\\d{4}-\\d{2}$", example = "2026-06", description = "Billing month in yyyy-MM format")
    private YearMonth billingMonth;
}
