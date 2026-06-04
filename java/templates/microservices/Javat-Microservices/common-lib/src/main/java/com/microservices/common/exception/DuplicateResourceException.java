package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when attempting to create a resource that already exists
 */
public class DuplicateResourceException extends BusinessException {
    
    public DuplicateResourceException(String message) {
        super(message, "DUPLICATE_RESOURCE", HttpStatus.CONFLICT);
    }
    
    public DuplicateResourceException(String message, String errorCode) {
        super(message, errorCode, HttpStatus.CONFLICT);
    }
    
    public static DuplicateResourceException username(String username) {
        return new DuplicateResourceException(
            String.format("Username '%s' is already taken", username),
            "USERNAME_EXISTS"
        );
    }
    
    public static DuplicateResourceException email(String email) {
        return new DuplicateResourceException(
            String.format("Email '%s' is already registered", email),
            "EMAIL_EXISTS"
        );
    }
}
