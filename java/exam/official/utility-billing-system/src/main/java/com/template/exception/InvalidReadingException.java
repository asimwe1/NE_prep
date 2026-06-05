package com.template.exception;

import java.math.BigDecimal;

public class InvalidReadingException extends RuntimeException {
    public InvalidReadingException(BigDecimal current, BigDecimal previous) {
        super("Current reading (" + current + ") must be greater than previous reading (" + previous + ")");
    }
}
