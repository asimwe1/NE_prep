package com.erp.erp_system.modules.employees.controller;

import com.erp.erp_system.common.response.ApiResponse;
import com.erp.erp_system.modules.employees.dto.*;
import com.erp.erp_system.modules.employees.mapper.EmployeeMapper;
import com.erp.erp_system.modules.employees.service.EmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;

    /** Creates an employee user. */
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Create employee", tags = "Employees")
    public ApiResponse<EmployeeResponse> create(@Valid @RequestBody EmployeeCreateRequest request) {
        return ApiResponse.success("Employee created successfully", employeeService.create(request));
    }

    /** Lists all employees. */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "List employees", tags = "Employees")
    public ApiResponse<List<EmployeeResponse>> findAll() {
        return ApiResponse.success("Employees fetched successfully", employeeService.findAll());
    }

    /** Gets the authenticated employee profile. */
    @GetMapping("/me")
    @Operation(summary = "View own employee details", tags = "Employees")
    public ApiResponse<EmployeeResponse> me(Principal principal) {
        return ApiResponse.success("Employee fetched successfully",
                EmployeeMapper.toResponse(employeeService.findEntityByEmail(principal.getName())));
    }

    /** Gets one employee by id. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "Get employee by id", tags = "Employees")
    public ApiResponse<EmployeeResponse> findOne(@PathVariable Long id) {
        return ApiResponse.success("Employee fetched successfully", employeeService.findOne(id));
    }

    /** Updates employee details. */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Update employee", tags = "Employees")
    public ApiResponse<EmployeeResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody EmployeeUpdateRequest request) {
        return ApiResponse.success("Employee updated successfully", employeeService.update(id, request));
    }
}
