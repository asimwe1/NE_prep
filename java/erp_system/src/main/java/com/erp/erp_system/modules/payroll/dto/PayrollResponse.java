package com.erp.erp_system.modules.payroll.dto;

import com.erp.erp_system.modules.payroll.entity.PayrollStatus;

import java.math.BigDecimal;

public record PayrollResponse(
        Long id, String employeeCode, String employeeName, BigDecimal baseSalary,
        BigDecimal housingAmount, BigDecimal transportAmount, BigDecimal grossSalary,
        BigDecimal employeeTaxedAmount, BigDecimal pensionAmount,
        BigDecimal medicalInsuranceAmount, BigDecimal otherTaxedAmount,
        BigDecimal netSalary, int month, int year, PayrollStatus status
) {
}
