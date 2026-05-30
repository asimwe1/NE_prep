package com.erp.erp_system.modules.payroll.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PayrollCalculatorTest {

    @Test
    void calculatesRwandaPayrollExampleWithSixPercentPension() {
        PayrollCalculator calculator = new PayrollCalculator();
        PayrollRates rates = new PayrollRates(
                new BigDecimal("30"),
                new BigDecimal("6"),
                new BigDecimal("5"),
                new BigDecimal("5")
        );

        PayrollCalculation result = calculator.calculate(new BigDecimal("70000"), rates);

        assertThat(result.gross()).isEqualByComparingTo("89600.00");
        assertThat(result.pension()).isEqualByComparingTo("4200.00");
        assertThat(result.net()).isEqualByComparingTo("57400.00");
    }
}
