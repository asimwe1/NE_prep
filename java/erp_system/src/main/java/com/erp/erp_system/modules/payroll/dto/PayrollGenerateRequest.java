package com.erp.erp_system.modules.payroll.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record PayrollGenerateRequest(@Min(1) @Max(12) int month, @Min(2025) int year) {
}
