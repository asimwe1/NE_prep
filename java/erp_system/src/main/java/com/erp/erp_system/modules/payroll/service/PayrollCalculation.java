package com.erp.erp_system.modules.payroll.service;

import java.math.BigDecimal;

public record PayrollCalculation(
        BigDecimal housing,
        BigDecimal transport,
        BigDecimal gross,
        BigDecimal employeeTax,
        BigDecimal pension,
        BigDecimal medicalInsurance,
        BigDecimal otherDeduction,
        BigDecimal net
) {
}
