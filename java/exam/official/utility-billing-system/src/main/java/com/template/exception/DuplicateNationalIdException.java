package com.template.exception;

public class DuplicateNationalIdException extends RuntimeException {
    public DuplicateNationalIdException(String nationalId) {
        super("A customer with national ID '" + nationalId + "' already exists");
    }
}
