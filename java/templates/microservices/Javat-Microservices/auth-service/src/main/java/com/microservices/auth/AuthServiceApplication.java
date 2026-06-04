package com.microservices.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.ComponentScan;

/**
 * Authentication Service Application
 * 
 * Handles user authentication and authorization:
 * - User registration
 * - Login with JWT tokens
 * - Refresh token management
 * - Password reset
 * 
 * Uses common-lib for validation, exceptions, and JWT utilities
 */
@SpringBootApplication
@EnableDiscoveryClient
@ComponentScan(basePackages = {"com.microservices"})  // Scan common-lib too
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
