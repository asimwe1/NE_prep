package com.erp.erp_system.modules.auth.controller;

import com.erp.erp_system.common.response.ApiResponse;
import com.erp.erp_system.modules.auth.dto.AuthResponse;
import com.erp.erp_system.modules.auth.dto.LoginRequest;
import com.erp.erp_system.modules.auth.service.AuthService;
import com.erp.erp_system.modules.employees.dto.EmployeeCreateRequest;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    /** Registers an employee as a system user. */
    @PostMapping("/register")
    @Operation(summary = "Register employee user", tags = "Authentication")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody EmployeeCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Employee registered successfully", authService.register(request)));
    }

    /** Authenticates a user and returns a JWT. */
    @PostMapping("/login")
    @Operation(summary = "Login user", tags = "Authentication")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Login successful", authService.login(request));
    }
}
