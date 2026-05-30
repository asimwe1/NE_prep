package com.erp.erp_system.modules.payroll.service;

import com.erp.erp_system.common.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PayrollCalculator {
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal ALLOWANCE_RATE = new BigDecimal("14.00");

    /** Calculates payroll amounts from the base salary and active rates. */
    public PayrollCalculation calculate(BigDecimal baseSalary, PayrollRates rates) {
        BigDecimal housing = percentage(baseSalary, ALLOWANCE_RATE);
        BigDecimal transport = percentage(baseSalary, ALLOWANCE_RATE);
        BigDecimal gross = baseSalary.add(housing).add(transport);
        BigDecimal tax = percentage(baseSalary, rates.employeeTax());
        BigDecimal pension = percentage(baseSalary, rates.pension());
        BigDecimal medical = percentage(baseSalary, rates.medicalInsurance());
        BigDecimal other = percentage(baseSalary, rates.otherDeduction());
        BigDecimal totalDeductions = tax.add(pension).add(medical).add(other);
        if (totalDeductions.compareTo(gross) > 0) throw new BusinessException("Deductions exceed gross salary");
        return new PayrollCalculation(housing, transport, gross, tax, pension, medical, other,
                gross.subtract(totalDeductions));
    }

    private BigDecimal percentage(BigDecimal value, BigDecimal percent) {
        return value.multiply(percent).divide(HUNDRED, 2, RoundingMode.HALF_UP);
    }
}
