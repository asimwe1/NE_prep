package com.template.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidNationalIdValidator implements ConstraintValidator<ValidNationalId, String> {

    private static final String NATIONAL_ID_REGEX = "^[0-9]{16}$";

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true; // delegate null/blank checks to @NotBlank
        }
        return value.matches(NATIONAL_ID_REGEX);
    }
}
