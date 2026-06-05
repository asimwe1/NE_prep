package com.template.controller;

import com.template.dto.MeterReadingRequest;
import com.template.dto.MeterReadingResponse;
import com.template.service.MeterReadingService;
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
@RequestMapping("/api/v1/readings")
@RequiredArgsConstructor
@Tag(name = "Meter Readings", description = "Meter reading capture and retrieval")
@SecurityRequirement(name = "bearerAuth")
public class MeterReadingController {

    private final MeterReadingService meterReadingService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
    @Operation(summary = "[ADMIN|OPERATOR] Capture a new meter reading")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Reading captured"),
        @ApiResponse(responseCode = "400", description = "Validation error or invalid reading value"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Meter is inactive"),
        @ApiResponse(responseCode = "404", description = "Meter not found"),
        @ApiResponse(responseCode = "409", description = "Duplicate reading for this meter and billing month")
    })
    public ResponseEntity<MeterReadingResponse> capture(@Valid @RequestBody MeterReadingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(meterReadingService.captureReading(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
    @Operation(summary = "[ADMIN|OPERATOR] List all meter readings (paginated)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of readings"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<MeterReadingResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(meterReadingService.listReadings(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/meter/{meterId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
    @Operation(summary = "[ADMIN|OPERATOR] List readings for a specific meter (paginated)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of readings for the meter"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Meter not found")
    })
    public ResponseEntity<Page<MeterReadingResponse>> listByMeter(
            @PathVariable UUID meterId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(meterReadingService.getReadingsByMeter(meterId,
                PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OPERATOR')")
    @Operation(summary = "[ADMIN|OPERATOR] Get a single meter reading by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Meter reading found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Reading not found")
    })
    public ResponseEntity<MeterReadingResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(meterReadingService.getById(id));
    }
}
