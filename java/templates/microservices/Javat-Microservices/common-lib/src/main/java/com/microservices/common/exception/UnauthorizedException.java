package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when authentication fails or is missing
 */
public class UnauthorizedException extends BusinessException {
    
    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED", HttpStatus.UNAUTHORIZED);
    }
    
    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause);
    }
}
