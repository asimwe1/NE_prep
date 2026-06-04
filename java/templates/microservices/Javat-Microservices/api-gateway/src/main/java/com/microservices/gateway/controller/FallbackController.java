package com.microservices.gateway.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Fallback controller for circuit breaker
 * Returns friendly error messages when services are unavailable
 */
@Slf4j
@RestController
public class FallbackController {

    @GetMapping("/fallback")
    public ResponseEntity<Map<String, Object>> fallback() {
        log.warn("Fallback triggered - service unavailable");
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Service temporarily unavailable. Please try again later.");
        response.put("errorCode", "SERVICE_UNAVAILABLE");
        response.put("timestamp", LocalDateTime.now());
        response.put("statusCode", 503);
        
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "API Gateway");
        response.put("version", "1.0.0");
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("message", "Welcome to Microservices API Gateway");
        response.put("documentation", "/swagger-ui.html");
        
        return ResponseEntity.ok(response);
    }
}
