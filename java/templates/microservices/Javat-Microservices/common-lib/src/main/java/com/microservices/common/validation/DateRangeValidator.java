package com.microservices.common.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.PropertyAccessorFactory;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Validator for @ValidDateRange annotation
 */
public class DateRangeValidator implements ConstraintValidator<ValidDateRange, Object> {
    
    private String startFieldName;
    private String endFieldName;
    
    @Override
    public void initialize(ValidDateRange constraintAnnotation) {
        this.startFieldName = constraintAnnotation.start();
        this.endFieldName = constraintAnnotation.end();
    }
    
    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        
        try {
            BeanWrapper beanWrapper = PropertyAccessorFactory.forBeanPropertyAccess(value);
            Object startValue = beanWrapper.getPropertyValue(startFieldName);
            Object endValue = beanWrapper.getPropertyValue(endFieldName);
            
            if (startValue == null || endValue == null) {
                return true; // Use @NotNull for null checks
            }
            
            // Handle LocalDate
            if (startValue instanceof LocalDate && endValue instanceof LocalDate) {
                LocalDate startDate = (LocalDate) startValue;
                LocalDate endDate = (LocalDate) endValue;
                return !startDate.isAfter(endDate);
            }
            
            // Handle LocalDateTime
            if (startValue instanceof LocalDateTime && endValue instanceof LocalDateTime) {
                LocalDateTime startDateTime = (LocalDateTime) startValue;
                LocalDateTime endDateTime = (LocalDateTime) endValue;
                return !startDateTime.isAfter(endDateTime);
            }
            
            return true;
            
        } catch (Exception e) {
            return false;
        }
    }
}
