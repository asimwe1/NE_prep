package com.microservices.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown for validation errors
 */
@Getter
public class ValidationException extends BusinessException {
    
    private final Map<String, String> validationErrors;
    
    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST);
        this.validationErrors = new HashMap<>();
    }
    
    public ValidationException(String message, Map<String, String> validationErrors) {
        super(message, "VALIDATION_ERROR", HttpStatus.BAD_REQUEST);
        this.validationErrors = validationErrors;
    }
    
    public ValidationException(Map<String, String> validationErrors) {
        super("Validation failed", "VALIDATION_ERROR", HttpStatus.BAD_REQUEST);
        this.validationErrors = validationErrors;
    }
}
