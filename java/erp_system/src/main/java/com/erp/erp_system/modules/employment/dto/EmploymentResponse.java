package com.erp.erp_system.modules.employment.dto;

import com.erp.erp_system.modules.employment.entity.EmploymentStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EmploymentResponse(
        Long id,
        String code,
        Long employeeId,
        String employeeCode,
        String employeeName,
        String department,
        String position,
        BigDecimal baseSalary,
        EmploymentStatus status,
        LocalDate joiningDate
) {
}
