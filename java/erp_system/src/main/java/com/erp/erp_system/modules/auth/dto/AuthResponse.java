package com.erp.erp_system.modules.auth.dto;

import com.erp.erp_system.modules.employees.dto.EmployeeResponse;

public record AuthResponse(String token, String tokenType, EmployeeResponse employee) {
}
