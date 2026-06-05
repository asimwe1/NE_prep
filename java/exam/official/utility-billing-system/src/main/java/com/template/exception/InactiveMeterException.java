package com.template.exception;

public class InactiveMeterException extends RuntimeException {
    public InactiveMeterException(String meterNumber) {
        super("Meter '" + meterNumber + "' is inactive and cannot accept readings");
    }
}
