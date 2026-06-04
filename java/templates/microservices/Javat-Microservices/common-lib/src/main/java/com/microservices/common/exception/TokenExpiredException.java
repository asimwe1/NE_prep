package com.microservices.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when a token (access or refresh) has expired
 */
public class TokenExpiredException extends BusinessException {
    
    public TokenExpiredException(String message) {
        super(message, "TOKEN_EXPIRED", HttpStatus.UNAUTHORIZED);
    }
    
    public TokenExpiredException(String message, String errorCode) {
        super(message, errorCode, HttpStatus.UNAUTHORIZED);
    }
    
    public static TokenExpiredException accessToken() {
        return new TokenExpiredException("Access token has expired", "ACCESS_TOKEN_EXPIRED");
    }
    
    public static TokenExpiredException refreshToken() {
        return new TokenExpiredException("Refresh token has expired", "REFRESH_TOKEN_EXPIRED");
    }
}
