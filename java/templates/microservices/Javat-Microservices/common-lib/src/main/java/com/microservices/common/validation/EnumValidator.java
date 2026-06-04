package com.microservices.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Validator for @ValidEnum annotation
 */
public class EnumValidator implements ConstraintValidator<ValidEnum, String> {
    
    private Class<? extends Enum<?>> enumClass;
    private boolean ignoreCase;
    
    @Override
    public void initialize(ValidEnum constraintAnnotation) {
        this.enumClass = constraintAnnotation.enumClass();
        this.ignoreCase = constraintAnnotation.ignoreCase();
    }
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true; // Use @NotNull/@NotBlank for null checks
        }
        
        Enum<?>[] enumConstants = enumClass.getEnumConstants();
        
        for (Enum<?> enumConstant : enumConstants) {
            String enumValue = enumConstant.name();
            
            if (ignoreCase ? enumValue.equalsIgnoreCase(value) : enumValue.equals(value)) {
                return true;
            }
        }
        
        // Add allowed values to error message
        String allowedValues = Arrays.stream(enumConstants)
                .map(Enum::name)
                .collect(Collectors.joining(", "));
        
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(
                "Invalid value. Allowed values are: " + allowedValues
        ).addConstraintViolation();
        
        return false;
    }
}
