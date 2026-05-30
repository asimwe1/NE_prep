package com.erp.erp_system.modules.employees.service;

import com.erp.erp_system.common.exception.DuplicateResourceException;
import com.erp.erp_system.common.exception.ResourceNotFoundException;
import com.erp.erp_system.modules.employees.dto.*;
import com.erp.erp_system.modules.employees.entity.Employee;
import com.erp.erp_system.modules.employees.mapper.EmployeeMapper;
import com.erp.erp_system.modules.employees.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    /** Creates a persisted employee entity with a hashed password. */
    @Transactional
    public Employee createEntity(EmployeeCreateRequest request) {
        validateUnique(request.code(), request.email(), null);
        String passwordHash = passwordEncoder.encode(request.password());
        return employeeRepository.save(EmployeeMapper.fromCreate(request, passwordHash));
    }

    /** Creates an employee and returns a public response. */
    @Transactional
    public EmployeeResponse create(EmployeeCreateRequest request) {
        return EmployeeMapper.toResponse(createEntity(request));
    }

    /** Updates an employee profile and roles. */
    @Transactional
    public EmployeeResponse update(Long id, EmployeeUpdateRequest request) {
        Employee employee = findEntity(id);
        validateUnique(employee.getCode(), request.email(), id);
        EmployeeMapper.update(employee, request);
        return EmployeeMapper.toResponse(employee);
    }

    /** Lists all employees. */
    public List<EmployeeResponse> findAll() {
        return employeeRepository.findAll().stream().map(EmployeeMapper::toResponse).toList();
    }

    /** Finds one employee by id. */
    public EmployeeResponse findOne(Long id) {
        return EmployeeMapper.toResponse(findEntity(id));
    }

    /** Finds an employee entity by id for internal workflows. */
    public Employee findEntity(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    /** Finds an employee entity by email for authentication workflows. */
    public Employee findEntityByEmail(String email) {
        return employeeRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private void validateUnique(String code, String email, Long currentId) {
        employeeRepository.findByEmail(email).ifPresent(existing -> {
            if (!existing.getId().equals(currentId)) throw new DuplicateResourceException("Email already exists");
        });
        employeeRepository.findByCode(code).ifPresent(existing -> {
            if (!existing.getId().equals(currentId)) throw new DuplicateResourceException("Code already exists");
        });
    }
}
