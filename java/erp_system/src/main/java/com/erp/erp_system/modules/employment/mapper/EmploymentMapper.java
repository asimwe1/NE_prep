package com.erp.erp_system.modules.employment.mapper;

import com.erp.erp_system.modules.employees.entity.Employee;
import com.erp.erp_system.modules.employment.dto.*;
import com.erp.erp_system.modules.employment.entity.Employment;

public class EmploymentMapper {
    private EmploymentMapper() {
    }

    /** Maps a request to an employment entity. */
    public static Employment fromRequest(EmploymentRequest request, Employee employee) {
        Employment employment = new Employment();
        employment.setEmployee(employee);
        update(employment, request, employee);
        return employment;
    }

    /** Applies request values to an existing employment entity. */
    public static void update(Employment employment, EmploymentRequest request, Employee employee) {
        employment.setCode(request.code());
        employment.setEmployee(employee);
        employment.setDepartment(request.department());
        employment.setPosition(request.position());
        employment.setBaseSalary(request.baseSalary());
        employment.setStatus(request.status());
        employment.setJoiningDate(request.joiningDate());
    }

    /** Maps an employment entity to its response DTO. */
    public static EmploymentResponse toResponse(Employment employment) {
        Employee employee = employment.getEmployee();
        String name = employee.getFirstName() + " " + employee.getLastName();
        return new EmploymentResponse(employment.getId(), employment.getCode(), employee.getId(),
                employee.getCode(), name, employment.getDepartment(), employment.getPosition(),
                employment.getBaseSalary(), employment.getStatus(), employment.getJoiningDate());
    }
}
