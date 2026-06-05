package com.template.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = ValidNationalIdValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidNationalId {

    String message() default "National ID must be exactly 16 digits with no letters";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
