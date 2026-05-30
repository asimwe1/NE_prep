package com.erp.erp_system.modules.auth.service;

import com.erp.erp_system.common.security.JwtService;
import com.erp.erp_system.modules.auth.dto.AuthResponse;
import com.erp.erp_system.modules.auth.dto.LoginRequest;
import com.erp.erp_system.modules.employees.dto.EmployeeCreateRequest;
import com.erp.erp_system.modules.employees.entity.Employee;
import com.erp.erp_system.modules.employees.mapper.EmployeeMapper;
import com.erp.erp_system.modules.employees.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final EmployeeService employeeService;
    private final JwtService jwtService;

    /** Registers a new employee user and returns a JWT. */
    public AuthResponse register(EmployeeCreateRequest request) {
        Employee employee = employeeService.createEntity(request);
        return authResponse(employee);
    }

    /** Authenticates employee credentials and returns a JWT. */
    public AuthResponse login(LoginRequest request) {
        var token = new UsernamePasswordAuthenticationToken(request.email(), request.password());
        authenticationManager.authenticate(token);
        return authResponse(employeeService.findEntityByEmail(request.email()));
    }

    private AuthResponse authResponse(Employee employee) {
        var roles = employee.getRoles().stream().map(Enum::name).toList();
        String token = jwtService.generateToken(employee.getEmail(), roles);
        return new AuthResponse(token, "Bearer", EmployeeMapper.toResponse(employee));
    }
}
