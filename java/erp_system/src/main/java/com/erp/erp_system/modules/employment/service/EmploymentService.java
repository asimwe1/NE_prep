package com.erp.erp_system.modules.employment.service;

import com.erp.erp_system.common.exception.DuplicateResourceException;
import com.erp.erp_system.common.exception.ResourceNotFoundException;
import com.erp.erp_system.modules.employees.entity.Employee;
import com.erp.erp_system.modules.employees.service.EmployeeService;
import com.erp.erp_system.modules.employment.dto.*;
import com.erp.erp_system.modules.employment.entity.Employment;
import com.erp.erp_system.modules.employment.mapper.EmploymentMapper;
import com.erp.erp_system.modules.employment.repository.EmploymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmploymentService {
    private final EmploymentRepository employmentRepository;
    private final EmployeeService employeeService;

    /** Creates an employment record for an employee. */
    @Transactional
    public EmploymentResponse create(EmploymentRequest request) {
        if (employmentRepository.existsByCode(request.code())) throw new DuplicateResourceException("Code exists");
        Employee employee = employeeService.findEntity(request.employeeId());
        return EmploymentMapper.toResponse(employmentRepository.save(EmploymentMapper.fromRequest(request, employee)));
    }

    /** Updates an employment record. */
    @Transactional
    public EmploymentResponse update(Long id, EmploymentRequest request) {
        Employment employment = findEntity(id);
        Employee employee = employeeService.findEntity(request.employeeId());
        EmploymentMapper.update(employment, request, employee);
        return EmploymentMapper.toResponse(employment);
    }

    /** Lists all employment records. */
    public List<EmploymentResponse> findAll() {
        return employmentRepository.findAll().stream().map(EmploymentMapper::toResponse).toList();
    }

    /** Finds an employment entity by id. */
    public Employment findEntity(Long id) {
        return employmentRepository.findWithEmployeeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employment record not found"));
    }
}
