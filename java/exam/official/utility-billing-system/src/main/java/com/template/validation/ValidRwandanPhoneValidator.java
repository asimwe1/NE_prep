package com.template.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidRwandanPhoneValidator implements ConstraintValidator<ValidRwandanPhone, String> {

    private static final String RWANDAN_PHONE_REGEX = "^(\\+?250|0)(7[2-9]|8[0-9])[0-9]{7}$";

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true; // delegate null/blank checks to @NotBlank
        }
        return value.matches(RWANDAN_PHONE_REGEX);
    }
}
