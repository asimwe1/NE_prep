package com.template.exception;

public class DuplicateMeterNumberException extends RuntimeException {
    public DuplicateMeterNumberException(String meterNumber) {
        super("A meter with number '" + meterNumber + "' already exists");
    }
}
