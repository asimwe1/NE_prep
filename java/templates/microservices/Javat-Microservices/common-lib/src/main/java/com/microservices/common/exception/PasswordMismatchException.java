package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when passwords don't match (e.g., password and confirmPassword)
 */
public class PasswordMismatchException extends BusinessException {
    
    public PasswordMismatchException() {
        super("Passwords do not match", "PASSWORD_MISMATCH", HttpStatus.BAD_REQUEST);
    }
    
    public PasswordMismatchException(String message) {
        super(message, "PASSWORD_MISMATCH", HttpStatus.BAD_REQUEST);
    }
}
