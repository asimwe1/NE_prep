package com.template.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidNameValidator implements ConstraintValidator<ValidName, String> {

    private static final String NAME_REGEX = "^[a-zA-Z\\s'\\-]+$";

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true; // delegate null/blank checks to @NotBlank
        }
        return value.matches(NAME_REGEX);
    }
}
