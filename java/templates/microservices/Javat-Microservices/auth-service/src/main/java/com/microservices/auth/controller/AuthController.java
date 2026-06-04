package com.microservices.auth.controller;

import com.microservices.auth.dto.*;
import com.microservices.auth.service.AuthService;
import com.microservices.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for authentication endpoints
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Register a new user
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("POST /api/auth/register - username: {}", request.getUsername());
        
        String deviceInfo = getDeviceInfo(httpRequest);
        String ipAddress = getClientIP(httpRequest);
        
        AuthResponse response = authService.register(request, deviceInfo, ipAddress);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "User registered successfully"));
    }

    /**
     * Login user
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("POST /api/auth/login - user: {}", request.getUsernameOrEmail());
        
        String deviceInfo = getDeviceInfo(httpRequest);
        String ipAddress = getClientIP(httpRequest);
        
        AuthResponse response = authService.login(request, deviceInfo, ipAddress);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    /**
     * Refresh access token
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("POST /api/auth/refresh");
        
        String deviceInfo = getDeviceInfo(httpRequest);
        String ipAddress = getClientIP(httpRequest);
        
        AuthResponse response = authService.refreshToken(request, deviceInfo, ipAddress);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed successfully"));
    }

    /**
     * Logout user (revoke refresh token)
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(
            @Valid @RequestBody LogoutRequest request) {
        
        log.info("POST /api/auth/logout");
        authService.logout(request);
        
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
    }

    /**
     * Logout from all devices (revoke all user's refresh tokens)
     */
    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<String>> logoutAll(
            @RequestParam String username) {
        
        log.info("POST /api/auth/logout-all - username: {}", username);
        authService.logoutAll(username);
        
        return ResponseEntity.ok(ApiResponse.success("Logged out from all devices successfully"));
    }

    /**
     * Get active sessions count
     */
    @GetMapping("/sessions/count")
    public ResponseEntity<ApiResponse<Long>> getActiveSessions(
            @RequestParam String username) {
        
        log.info("GET /api/auth/sessions/count - username: {}", username);
        long count = authService.getActiveSessionsCount(username);
        
        return ResponseEntity.ok(ApiResponse.success(count, 
                String.format("User has %d active session(s)", count)));
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Auth Service is running"));
    }

    /**
     * Extract device info from request
     */
    private String getDeviceInfo(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null || userAgent.isEmpty()) {
            return "Unknown Device";
        }
        // Simplify user agent string
        if (userAgent.length() > 50) {
            return userAgent.substring(0, 47) + "...";
        }
        return userAgent;
    }

    /**
     * Extract client IP address from request
     */
    private String getClientIP(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Handle multiple IPs (take first)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
