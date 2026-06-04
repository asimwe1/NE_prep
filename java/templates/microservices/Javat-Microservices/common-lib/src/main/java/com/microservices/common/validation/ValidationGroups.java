package com.microservices.common.validation;

/**
 * Validation groups for different scenarios
 * Usage: @Validated(ValidationGroups.Create.class)
 */
public interface ValidationGroups {
    
    /**
     * Validation group for create operations
     */
    interface Create {}
    
    /**
     * Validation group for update operations
     */
    interface Update {}
    
    /**
     * Validation group for partial update operations (PATCH)
     */
    interface PartialUpdate {}
    
    /**
     * Validation group for delete operations
     */
    interface Delete {}
}
