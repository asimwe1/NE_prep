package com.microservices.auth.controller;

import com.microservices.auth.dto.RoleRequest;
import com.microservices.auth.entity.User;
import com.microservices.auth.service.RoleService;
import com.microservices.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

/**
 * REST controller for role management
 * All endpoints require ADMIN role
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/roles")
@RequiredArgsConstructor
public class RoleController {

    private final RoleService roleService;

    /**
     * Add role to user
     * Only admins can add roles
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Set<String>>> addRole(
            @Valid @RequestBody RoleRequest request) {
        
        log.info("POST /api/auth/roles/add - user: {}, role: {}", 
                request.getUsername(), request.getRole());
        
        Set<String> roles = roleService.addRoleToUser(request.getUsername(), request.getRole());
        
        return ResponseEntity.ok(ApiResponse.success(roles, 
                String.format("Role '%s' added to user successfully", request.getRole())));
    }

    /**
     * Remove role from user
     * Only admins can remove roles
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/remove")
    public ResponseEntity<ApiResponse<Set<String>>> removeRole(
            @Valid @RequestBody RoleRequest request) {
        
        log.info("POST /api/auth/roles/remove - user: {}, role: {}", 
                request.getUsername(), request.getRole());
        
        Set<String> roles = roleService.removeRoleFromUser(request.getUsername(), request.getRole());
        
        return ResponseEntity.ok(ApiResponse.success(roles, 
                String.format("Role '%s' removed from user successfully", request.getRole())));
    }

    /**
     * Get user's roles
     * Only admins can view roles
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{username}")
    public ResponseEntity<ApiResponse<Set<String>>> getUserRoles(
            @PathVariable String username) {
        
        log.info("GET /api/auth/roles/{} - Fetching user roles", username);
        
        Set<String> roles = roleService.getUserRoles(username);
        
        return ResponseEntity.ok(ApiResponse.success(roles, "User roles retrieved successfully"));
    }

    /**
     * Check if user has specific role
     * Only admins can check roles
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{username}/has/{role}")
    public ResponseEntity<ApiResponse<Boolean>> hasRole(
            @PathVariable String username,
            @PathVariable String role) {
        
        log.info("GET /api/auth/roles/{}/has/{} - Checking role", username, role);
        
        boolean hasRole = roleService.userHasRole(username, role);
        
        return ResponseEntity.ok(ApiResponse.success(hasRole, 
                String.format("User %s role '%s'", hasRole ? "has" : "does not have", role)));
    }
}
