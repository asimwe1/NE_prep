package com.template.exception;

import java.math.BigDecimal;

public class OverpaymentException extends RuntimeException {
    public OverpaymentException(BigDecimal amount, BigDecimal balance) {
        super("Payment amount " + amount + " exceeds the outstanding balance of " + balance);
    }
}
