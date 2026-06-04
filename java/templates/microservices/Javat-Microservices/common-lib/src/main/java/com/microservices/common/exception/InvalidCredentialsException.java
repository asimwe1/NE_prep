package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when login credentials are invalid
 */
public class InvalidCredentialsException extends BusinessException {
    
    public InvalidCredentialsException() {
        super("Invalid username/email or password", "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED);
    }
    
    public InvalidCredentialsException(String message) {
        super(message, "INVALID_CREDENTIALS", HttpStatus.UNAUTHORIZED);
    }
}
