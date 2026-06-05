package com.template.controller;

import com.template.dto.CustomerCreateRequest;
import com.template.dto.CustomerResponse;
import com.template.dto.CustomerUpdateRequest;
import com.template.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Customers", description = "Customer management")
@SecurityRequirement(name = "bearerAuth")
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Create a new customer", description = "Optionally pass userId in the body to link an existing ROLE_CUSTOMER login account to the customer profile.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Customer created"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden"),
        @ApiResponse(responseCode = "409", description = "National ID already registered")
    })
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CustomerCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.createCustomer(request));
    }

    @PutMapping("/{customerId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Update customer details", description = "Identify the customer with customerId in the path. Do not send userId in the body; use create to link a login account.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Customer updated"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Customer not found"),
        @ApiResponse(responseCode = "409", description = "National ID already registered")
    })
    public ResponseEntity<CustomerResponse> update(
            @Parameter(description = "Customer profile ID, or linked ROLE_CUSTOMER user ID")
            @PathVariable UUID customerId,
            @Valid @RequestBody CustomerUpdateRequest request) {
        return ResponseEntity.ok(customerService.updateCustomer(customerId, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] List all customers (paginated)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of customers"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<CustomerResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(customerService.listCustomers(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/national-id/{nationalId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    @Operation(summary = "[ADMIN|CUSTOMER] Get customer by National ID", description = "Recommended customer lookup for Swagger/Postman because National ID is the customer-facing identifier.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Customer found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<CustomerResponse> getByNationalId(@PathVariable String nationalId) {
        return ResponseEntity.ok(customerService.getByNationalId(nationalId));
    }

    @GetMapping("/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CUSTOMER')")
    @Operation(summary = "[ADMIN|CUSTOMER] Get customer by ID", description = "customerId accepts either the customer profile ID or the linked ROLE_CUSTOMER user ID. Prefer /national-id/{nationalId} for user-facing operations.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Customer found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<CustomerResponse> getById(
            @Parameter(description = "Customer profile ID, or linked ROLE_CUSTOMER user ID")
            @PathVariable UUID customerId) {
        return ResponseEntity.ok(customerService.getById(customerId));
    }

    @PatchMapping("/{customerId}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Activate a customer")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Customer activated"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<CustomerResponse> activate(
            @Parameter(description = "Customer profile ID, or linked ROLE_CUSTOMER user ID")
            @PathVariable UUID customerId) {
        return ResponseEntity.ok(customerService.activate(customerId));
    }

    @PatchMapping("/{customerId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Deactivate a customer")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Customer deactivated"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<CustomerResponse> deactivate(
            @Parameter(description = "Customer profile ID, or linked ROLE_CUSTOMER user ID")
            @PathVariable UUID customerId) {
        return ResponseEntity.ok(customerService.deactivate(customerId));
    }
}
