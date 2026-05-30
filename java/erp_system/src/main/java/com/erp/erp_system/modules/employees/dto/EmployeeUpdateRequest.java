package com.erp.erp_system.modules.employees.dto;

import com.erp.erp_system.modules.employees.entity.EmployeeStatus;
import com.erp.erp_system.modules.employees.entity.Role;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.Set;

public record EmployeeUpdateRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email @NotBlank String email,
        @NotEmpty Set<Role> roles,
        @NotBlank String mobile,
        @NotNull @Past LocalDate dateOfBirth,
        @NotNull EmployeeStatus status
) {
}
