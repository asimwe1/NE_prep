package com.template.controller;

import com.template.dto.BillGenerateRequest;
import com.template.dto.BillResponse;
import com.template.service.BillService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bills")
@RequiredArgsConstructor
@Tag(name = "Bills", description = "Utility bill generation and management")
@SecurityRequirement(name = "bearerAuth")
public class BillController {

    private final BillService billService;

    @PostMapping("/generate")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE')")
    @Operation(summary = "[ADMIN|FINANCE] Generate a utility bill for a meter and billing month")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Bill generated"),
        @ApiResponse(responseCode = "400", description = "Validation error, inactive customer, or future billing month"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Meter, reading, or active tariff not found")
    })
    public ResponseEntity<BillResponse> generate(@Valid @RequestBody BillGenerateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billService.generateBill(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE')")
    @Operation(summary = "[ADMIN|FINANCE] List all bills (paginated)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of bills"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<BillResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(billService.listBills(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CUSTOMER')")
    @Operation(summary = "[ADMIN|FINANCE|CUSTOMER] Get bill by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Bill found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Bill not found")
    })
    public ResponseEntity<BillResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(billService.getBillById(id));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CUSTOMER')")
    @Operation(summary = "[ADMIN|FINANCE|CUSTOMER] List bills for a specific customer (paginated)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of bills for the customer"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<Page<BillResponse>> getByCustomer(
            @PathVariable UUID customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                billService.getBillsByCustomer(customerId, PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/customer/national-id/{nationalId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CUSTOMER')")
    @Operation(summary = "[ADMIN|FINANCE|CUSTOMER] List bills for a customer by National ID (paginated)", description = "Recommended customer-facing bill lookup.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of bills for the customer"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<Page<BillResponse>> getByCustomerNationalId(
            @PathVariable String nationalId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                billService.getBillsByCustomerNationalId(nationalId, PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }
}
