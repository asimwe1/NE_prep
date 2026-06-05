package com.template.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ValidRwandanPhoneValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidRwandanPhone {

    String message() default "Phone number must be a valid Rwandan number (+2507XXXXXXX or 07XXXXXXX)";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
