package com.template.controller;

import com.template.dto.MeterRequest;
import com.template.dto.MeterResponse;
import com.template.service.MeterService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/meters")
@RequiredArgsConstructor
@Tag(name = "Meters", description = "Utility meter management")
@SecurityRequirement(name = "bearerAuth")
public class MeterController {

    private final MeterService meterService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign a new meter to a customer", description = "customerId accepts either the customer profile ID or a ROLE_CUSTOMER user ID. If the user has no customer profile yet, also provide customerNationalId and customerDistrict so the profile can be created and linked.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Meter assigned"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Customer not found"),
        @ApiResponse(responseCode = "409", description = "Meter number already exists")
    })
    public ResponseEntity<MeterResponse> assign(@Valid @RequestBody MeterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(meterService.assignMeter(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update meter details")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Meter updated"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Meter or customer not found"),
        @ApiResponse(responseCode = "409", description = "Meter number already exists")
    })
    public ResponseEntity<MeterResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody MeterRequest request) {
        return ResponseEntity.ok(meterService.updateMeter(id, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
    @Operation(summary = "List all meters (paginated)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of meters"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<MeterResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(meterService.listMeters(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR') or hasRole('CUSTOMER')")
    @Operation(summary = "List meters for a specific customer", description = "customerId accepts either the customer profile ID or the linked ROLE_CUSTOMER user ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "List of meters for the customer"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Customer not found")
    })
    public ResponseEntity<List<MeterResponse>> listByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(meterService.listByCustomer(customerId));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate a meter")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Meter activated"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Meter not found")
    })
    public ResponseEntity<MeterResponse> activate(@PathVariable UUID id) {
        return ResponseEntity.ok(meterService.activate(id));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a meter")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Meter deactivated"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Meter not found")
    })
    public ResponseEntity<MeterResponse> deactivate(@PathVariable UUID id) {
        return ResponseEntity.ok(meterService.deactivate(id));
    }
}
