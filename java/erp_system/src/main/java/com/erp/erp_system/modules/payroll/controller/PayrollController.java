package com.erp.erp_system.modules.payroll.controller;

import com.erp.erp_system.common.response.ApiResponse;
import com.erp.erp_system.modules.payroll.dto.*;
import com.erp.erp_system.modules.payroll.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/payroll")
@RequiredArgsConstructor
public class PayrollController {
    private final PayrollService payrollService;

    /** Generates payroll for active employees in a month and year. */
    @PostMapping("/generate")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Generate payroll", tags = "Payroll")
    public ApiResponse<List<PayrollResponse>> generate(@Valid @RequestBody PayrollGenerateRequest request) {
        return ApiResponse.success("Payroll generated successfully", payrollService.generate(request));
    }

    /** Lists payroll records by month and year. */
    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    @Operation(summary = "List payroll by period", tags = "Payroll")
    public ApiResponse<List<PayrollResponse>> findByPeriod(@RequestParam int month, @RequestParam int year) {
        return ApiResponse.success("Payroll fetched successfully", payrollService.findByPeriod(month, year));
    }

    /** Lists pending salary payments. */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "View pending salary payments", tags = "Payroll")
    public ApiResponse<List<PayrollResponse>> pending() {
        return ApiResponse.success("Pending payroll fetched successfully", payrollService.findPending());
    }

    /** Lists authenticated employee pending salary payments. */
    @GetMapping("/me/pending")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    @Operation(summary = "View own pending salary payments", tags = "Payroll")
    public ApiResponse<List<PayrollResponse>> ownPending(Principal principal) {
        return ApiResponse.success("Pending payroll fetched successfully", payrollService.findOwnPending(principal.getName()));
    }

    /** Lists authenticated employee payslips. */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    @Operation(summary = "View own payslips", tags = "Payroll")
    public ApiResponse<List<PayrollResponse>> ownPayslips(Principal principal) {
        return ApiResponse.success("Payslips fetched successfully", payrollService.findOwnPayslips(principal.getName()));
    }

    /** Approves pending payroll and sends a salary email. */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve payroll payment", tags = "Payroll")
    public ApiResponse<PayrollResponse> approve(@PathVariable Long id) {
        return ApiResponse.success("Payroll approved successfully", payrollService.approve(id));
    }
}
