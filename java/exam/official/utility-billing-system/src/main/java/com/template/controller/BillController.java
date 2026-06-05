package com.template.controller;

import com.template.dto.BillGenerateRequest;
import com.template.dto.BillResponse;
import com.template.service.BillService;
import io.swagger.v3.oas.annotations.Operation;
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
    @Operation(summary = "Generate a utility bill for a meter and billing month")
    public ResponseEntity<BillResponse> generate(@Valid @RequestBody BillGenerateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billService.generateBill(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE')")
    @Operation(summary = "List all bills (paginated)")
    public ResponseEntity<Page<BillResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(billService.listBills(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CUSTOMER')")
    @Operation(summary = "Get bill by ID")
    public ResponseEntity<BillResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(billService.getBillById(id));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CUSTOMER')")
    @Operation(summary = "List bills for a specific customer (paginated)")
    public ResponseEntity<Page<BillResponse>> getByCustomer(
            @PathVariable UUID customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                billService.getBillsByCustomer(customerId, PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }
}
