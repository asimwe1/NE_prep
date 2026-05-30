package com.erp.erp_system.modules.employees.mapper;

import com.erp.erp_system.modules.employees.dto.EmployeeCreateRequest;
import com.erp.erp_system.modules.employees.dto.EmployeeResponse;
import com.erp.erp_system.modules.employees.dto.EmployeeUpdateRequest;
import com.erp.erp_system.modules.employees.entity.Employee;

public class EmployeeMapper {
    private EmployeeMapper() {
    }

    /** Maps a creation request to an employee entity. */
    public static Employee fromCreate(EmployeeCreateRequest request, String passwordHash) {
        Employee employee = new Employee();
        employee.setCode(request.code());
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setPassword(passwordHash);
        employee.setRoles(request.roles());
        employee.setMobile(request.mobile());
        employee.setDateOfBirth(request.dateOfBirth());
        return employee;
    }

    /** Applies update request values to an existing employee. */
    public static void update(Employee employee, EmployeeUpdateRequest request) {
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setRoles(request.roles());
        employee.setMobile(request.mobile());
        employee.setDateOfBirth(request.dateOfBirth());
        employee.setStatus(request.status());
    }

    /** Maps an employee entity to its public API response. */
    public static EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getCode(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getRoles(),
                employee.getMobile(),
                employee.getDateOfBirth(),
                employee.getStatus()
        );
    }
}
