package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when user doesn't have permission to access a resource
 */
public class ForbiddenException extends BusinessException {
    
    public ForbiddenException(String message) {
        super(message, "FORBIDDEN", HttpStatus.FORBIDDEN);
    }
    
    public ForbiddenException(String message, Throwable cause) {
        super(message, cause);
    }
}
