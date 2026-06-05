package com.template.controller;

import com.template.dto.*;
import com.template.service.TariffService;
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
@RequestMapping("/api/v1/tariffs")
@RequiredArgsConstructor
@Tag(name = "Tariffs", description = "Tariff, tax, and penalty configuration management")
@SecurityRequirement(name = "bearerAuth")
public class TariffController {

    private final TariffService tariffService;

    // ─── Tariff endpoints ────────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new tariff")
    public ResponseEntity<TariffResponse> createTariff(@Valid @RequestBody TariffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tariffService.createTariff(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all tariffs (paginated)")
    public ResponseEntity<Page<TariffResponse>> listTariffs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tariffService.listTariffs(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get tariff by ID")
    public ResponseEntity<TariffResponse> getTariff(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.getTariffById(id));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a tariff")
    public ResponseEntity<TariffResponse> deactivateTariff(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.deactivateTariff(id));
    }

    // ─── Tax configuration endpoints ─────────────────────────────────────────

    @PostMapping("/taxes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a tax configuration")
    public ResponseEntity<TaxConfigurationResponse> createTaxConfig(
            @Valid @RequestBody TaxConfigurationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tariffService.createTaxConfig(request));
    }

    @GetMapping("/taxes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all tax configurations (paginated)")
    public ResponseEntity<Page<TaxConfigurationResponse>> listTaxConfigs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tariffService.listTaxConfigs(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @PatchMapping("/taxes/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a tax configuration")
    public ResponseEntity<TaxConfigurationResponse> deactivateTaxConfig(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.deactivateTaxConfig(id));
    }

    // ─── Penalty configuration endpoints ─────────────────────────────────────

    @PostMapping("/penalties")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a penalty configuration")
    public ResponseEntity<PenaltyConfigurationResponse> createPenaltyConfig(
            @Valid @RequestBody PenaltyConfigurationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tariffService.createPenaltyConfig(request));
    }

    @GetMapping("/penalties")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all penalty configurations (paginated)")
    public ResponseEntity<Page<PenaltyConfigurationResponse>> listPenaltyConfigs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tariffService.listPenaltyConfigs(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @PatchMapping("/penalties/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate a penalty configuration")
    public ResponseEntity<PenaltyConfigurationResponse> deactivatePenaltyConfig(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.deactivatePenaltyConfig(id));
    }
}
