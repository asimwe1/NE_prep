package com.template.exception;

public class DuplicateReadingException extends RuntimeException {
    public DuplicateReadingException(String meterNumber, String billingMonth) {
        super("A reading for meter '" + meterNumber + "' already exists for billing month " + billingMonth);
    }
}
