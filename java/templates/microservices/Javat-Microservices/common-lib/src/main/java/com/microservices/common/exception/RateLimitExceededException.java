package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when rate limit is exceeded
 */
public class RateLimitExceededException extends BusinessException {
    
    public RateLimitExceededException() {
        super("Too many requests. Please try again later.", 
              "RATE_LIMIT_EXCEEDED", 
              HttpStatus.TOO_MANY_REQUESTS);
    }
    
    public RateLimitExceededException(String message) {
        super(message, "RATE_LIMIT_EXCEEDED", HttpStatus.TOO_MANY_REQUESTS);
    }
    
    public static RateLimitExceededException loginAttempts(int retryAfterSeconds) {
        return new RateLimitExceededException(
            String.format("Too many login attempts. Please try again after %d seconds.", retryAfterSeconds)
        );
    }
}
