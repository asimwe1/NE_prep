package com.template.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    private YearMonth billingMonth;
}
