package com.erp.erp_system.modules.employees.dto;

import com.erp.erp_system.modules.employees.entity.EmployeeStatus;
import com.erp.erp_system.modules.employees.entity.Role;

import java.time.LocalDate;
import java.util.Set;

public record EmployeeResponse(
        Long id,
        String code,
        String firstName,
        String lastName,
        String email,
        Set<Role> roles,
        String mobile,
        LocalDate dateOfBirth,
        EmployeeStatus status
) {
}
