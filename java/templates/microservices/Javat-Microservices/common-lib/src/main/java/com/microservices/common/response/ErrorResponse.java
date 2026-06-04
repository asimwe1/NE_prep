package com.microservices.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Detailed error response for exceptions and validation errors
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    
    private boolean success;
    private String message;
    private String errorCode;
    private int statusCode;
    private LocalDateTime timestamp;
    private String path;
    private List<String> details;
    private Map<String, String> validationErrors;
    
    /**
     * Create a simple error response
     */
    public static ErrorResponse of(String message, int statusCode, String path) {
        return ErrorResponse.builder()
                .success(false)
                .message(message)
                .statusCode(statusCode)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Create an error response with error code
     */
    public static ErrorResponse of(String message, String errorCode, int statusCode, String path) {
        return ErrorResponse.builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .statusCode(statusCode)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Create an error response with validation errors
     */
    public static ErrorResponse withValidationErrors(String message, Map<String, String> validationErrors, String path) {
        return ErrorResponse.builder()
                .success(false)
                .message(message)
                .errorCode("VALIDATION_ERROR")
                .statusCode(400)
                .validationErrors(validationErrors)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Create an error response with details list
     */
    public static ErrorResponse withDetails(String message, List<String> details, int statusCode, String path) {
        return ErrorResponse.builder()
                .success(false)
                .message(message)
                .statusCode(statusCode)
                .details(details)
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
