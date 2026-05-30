package com.erp.erp_system.modules.deductions.controller;

import com.erp.erp_system.common.response.ApiResponse;
import com.erp.erp_system.modules.deductions.dto.*;
import com.erp.erp_system.modules.deductions.service.DeductionService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deductions")
@RequiredArgsConstructor
public class DeductionController {
    private final DeductionService deductionService;

    /** Creates a deduction rate. */
    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Create deduction rate", tags = "Deductions")
    public ApiResponse<DeductionResponse> create(@Valid @RequestBody DeductionRequest request) {
        return ApiResponse.success("Deduction created successfully", deductionService.create(request));
    }

    /** Lists configured deduction rates. */
    @GetMapping
    @Operation(summary = "List deduction rates", tags = "Deductions")
    public ApiResponse<List<DeductionResponse>> findAll() {
        return ApiResponse.success("Deductions fetched successfully", deductionService.findAll());
    }

    /** Updates a deduction rate. */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Update deduction rate", tags = "Deductions")
    public ApiResponse<DeductionResponse> update(@PathVariable Long id,
                                                 @Valid @RequestBody DeductionRequest request) {
        return ApiResponse.success("Deduction updated successfully", deductionService.update(id, request));
    }
}
