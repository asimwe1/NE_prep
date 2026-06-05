package com.template.controller;

import com.template.dto.MeterRequest;
import com.template.dto.MeterResponse;
import com.template.service.MeterService;
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
    @Operation(summary = "Assign a new meter to a customer")
    public ResponseEntity<MeterResponse> assign(@Valid @RequestBody MeterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(meterService.assignMeter(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update meter details")
    public ResponseEntity<MeterResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody MeterRequest request) {
        return ResponseEntity.ok(meterService.updateMeter(id, request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
    @Operation(summary = "List all meters (paginated)")
    public ResponseEntity<Page<MeterResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(meterService.listMeters(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR') or hasRole('CUSTOMER')")
    @Operation(summary = "List meters for a specific customer")
    public ResponseEntity<List<MeterResponse>> listByCustomer(@PathVariable UUID customerId) {
        return ResponseEntity.ok(meterService.listByCustomer(customerId));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activate a meter")
    public ResponseEntity<MeterResponse> activate(@PathVariable UUID id) {
        return ResponseEntity.ok(meterService.activate(id));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a meter")
    public ResponseEntity<MeterResponse> deactivate(@PathVariable UUID id) {
        return ResponseEntity.ok(meterService.deactivate(id));
    }
}
