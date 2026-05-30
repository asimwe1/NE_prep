package com.erp.erp_system.modules.payroll.service;

import java.math.BigDecimal;

public record PayrollRates(
        BigDecimal employeeTax,
        BigDecimal pension,
        BigDecimal medicalInsurance,
        BigDecimal otherDeduction
) {
}
