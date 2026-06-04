package com.microservices.common.validation;

import com.microservices.common.exception.ValidationException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Utility class for programmatic validation
 */
public final class ValidationUtil {
    
    private ValidationUtil() {
        throw new UnsupportedOperationException("This is a utility class and cannot be instantiated");
    }
    
    /**
     * Validate object and throw ValidationException if invalid
     */
    public static <T> void validate(T object, Validator validator) {
        Set<ConstraintViolation<T>> violations = validator.validate(object);
        
        if (!violations.isEmpty()) {
            Map<String, String> errors = new HashMap<>();
            
            for (ConstraintViolation<T> violation : violations) {
                String fieldName = violation.getPropertyPath().toString();
                String message = violation.getMessage();
                errors.put(fieldName, message);
            }
            
            throw new ValidationException("Validation failed", errors);
        }
    }
    
    /**
     * Validate object with validation groups and throw ValidationException if invalid
     */
    public static <T> void validate(T object, Validator validator, Class<?>... groups) {
        Set<ConstraintViolation<T>> violations = validator.validate(object, groups);
        
        if (!violations.isEmpty()) {
            Map<String, String> errors = new HashMap<>();
            
            for (ConstraintViolation<T> violation : violations) {
                String fieldName = violation.getPropertyPath().toString();
                String message = violation.getMessage();
                errors.put(fieldName, message);
            }
            
            throw new ValidationException("Validation failed", errors);
        }
    }
    
    /**
     * Validate object and return validation errors (without throwing exception)
     */
    public static <T> Map<String, String> getValidationErrors(T object, Validator validator) {
        Set<ConstraintViolation<T>> violations = validator.validate(object);
        Map<String, String> errors = new HashMap<>();
        
        for (ConstraintViolation<T> violation : violations) {
            String fieldName = violation.getPropertyPath().toString();
            String message = violation.getMessage();
            errors.put(fieldName, message);
        }
        
        return errors;
    }
    
    /**
     * Check if object is valid
     */
    public static <T> boolean isValid(T object, Validator validator) {
        return validator.validate(object).isEmpty();
    }
}
