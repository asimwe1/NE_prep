package com.template.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Allows human names and district names while rejecting digits and symbols.
 */
@Documented
@Constraint(validatedBy = ValidNameValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidName {

    String message() default "Name must contain only letters, spaces, hyphens, or apostrophes";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
