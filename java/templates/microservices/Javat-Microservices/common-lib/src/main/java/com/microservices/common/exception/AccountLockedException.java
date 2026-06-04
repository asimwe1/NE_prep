package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a user account is locked
 */
public class AccountLockedException extends BusinessException {
    
    public AccountLockedException() {
        super("Your account has been locked due to multiple failed login attempts", 
              "ACCOUNT_LOCKED", 
              HttpStatus.FORBIDDEN);
    }
    
    public AccountLockedException(String message) {
        super(message, "ACCOUNT_LOCKED", HttpStatus.FORBIDDEN);
    }
    
    public static AccountLockedException dueToFailedAttempts(int attempts) {
        return new AccountLockedException(
            String.format("Account locked after %d failed login attempts. Please contact support.", attempts)
        );
    }
}
