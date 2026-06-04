package com.microservices.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Validator for @ValidPhoneNumber annotation
 * Validates E.164 international phone number format
 */
public class PhoneNumberValidator implements ConstraintValidator<ValidPhoneNumber, String> {
    
    // E.164 format: +[country code][subscriber number]
    // Length: 1-15 digits (excluding the + sign)
    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+[1-9]\\d{1,14}$");
    
    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return true; // Use @NotNull/@NotBlank for null checks
        }
        
        return PHONE_PATTERN.matcher(phoneNumber).matches();
    }
}
