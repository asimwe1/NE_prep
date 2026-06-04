package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a token is invalid or malformed
 */
public class InvalidTokenException extends BusinessException {
    
    public InvalidTokenException(String message) {
        super(message, "INVALID_TOKEN", HttpStatus.UNAUTHORIZED);
    }
    
    public InvalidTokenException(String message, String errorCode) {
        super(message, errorCode, HttpStatus.UNAUTHORIZED);
    }
    
    public static InvalidTokenException malformed() {
        return new InvalidTokenException("Token is malformed or invalid", "MALFORMED_TOKEN");
    }
    
    public static InvalidTokenException revoked() {
        return new InvalidTokenException("Token has been revoked", "TOKEN_REVOKED");
    }
    
    public static InvalidTokenException notFound() {
        return new InvalidTokenException("Token not found", "TOKEN_NOT_FOUND");
    }
}
