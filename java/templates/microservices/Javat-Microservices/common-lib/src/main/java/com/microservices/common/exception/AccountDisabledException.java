package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user account is disabled
 */
public class AccountDisabledException extends BusinessException {
    
    public AccountDisabledException() {
        super("Your account has been disabled. Please contact support.", 
              "ACCOUNT_DISABLED", 
              HttpStatus.FORBIDDEN);
    }
    
    public AccountDisabledException(String message) {
        super(message, "ACCOUNT_DISABLED", HttpStatus.FORBIDDEN);
    }
}
