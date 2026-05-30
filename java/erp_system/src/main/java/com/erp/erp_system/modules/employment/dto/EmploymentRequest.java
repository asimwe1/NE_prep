package com.erp.erp_system.modules.employment.dto;

import com.erp.erp_system.modules.employment.entity.EmploymentStatus;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmploymentRequest(
        @NotBlank String code,
        @NotNull Long employeeId,
        @NotBlank String department,
        @NotBlank String position,
        @NotNull @Positive BigDecimal baseSalary,
        @NotNull EmploymentStatus status,
        @NotNull LocalDate joiningDate
) {
}
