package com.erp.erp_system.modules.employment.controller;

import com.erp.erp_system.common.response.ApiResponse;
import com.erp.erp_system.modules.employment.dto.*;
import com.erp.erp_system.modules.employment.service.EmploymentService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employment")
@RequiredArgsConstructor
public class EmploymentController {
    private final EmploymentService employmentService;

    /** Creates an employment record. */
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Create employment record", tags = "Employment")
    public ApiResponse<EmploymentResponse> create(@Valid @RequestBody EmploymentRequest request) {
        return ApiResponse.success("Employment created successfully", employmentService.create(request));
    }

    /** Lists employment records. */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "List employment records", tags = "Employment")
    public ApiResponse<List<EmploymentResponse>> findAll() {
        return ApiResponse.success("Employment records fetched successfully", employmentService.findAll());
    }

    /** Updates an employment record. */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Update employment record", tags = "Employment")
    public ApiResponse<EmploymentResponse> update(@PathVariable Long id,
                                                  @Valid @RequestBody EmploymentRequest request) {
        return ApiResponse.success("Employment updated successfully", employmentService.update(id, request));
    }
}
