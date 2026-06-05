package com.template.controller;

import com.template.dto.*;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import com.template.service.TariffService;
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
@RequestMapping("/api/v1/tariffs")
@RequiredArgsConstructor
@Tag(name = "Tariffs", description = "Tariff, tax, and penalty configuration management")
@SecurityRequirement(name = "bearerAuth")
public class TariffController {

    private final TariffService tariffService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Create a new tariff")
    @RequestBody(
            required = true,
            content = @Content(
                    mediaType = "application/json",
                    examples = {
                            @ExampleObject(
                                    name = "Tier Based Water Tariff",
                                    value = """
                                            {
                                              "tariffCode": "WATER_PREPAID_TIER_202606_V1",
                                              "utilityType": "WATER",
                                              "billingMode": "PREPAID",
                                              "tariffType": "TIER_BASED",
                                              "version": 1,
                                              "effectiveStartCycle": "2026-06",
                                              "effectiveEndCycle": "2026-12",
                                              "fixedServiceCharge": 0,
                                              "vatRate": 18,
                                              "tiers": [
                                                {
                                                  "tierMin": 0,
                                                  "tierMax": 15,
                                                  "unitPrice": 120
                                                },
                                                {
                                                  "tierMin": 15,
                                                  "tierMax": 50,
                                                  "unitPrice": 180
                                                }
                                              ]
                                            }
                                            """
                            ),
                            @ExampleObject(
                                    name = "Flat Electricity Tariff",
                                    value = """
                                            {
                                              "tariffCode": "ELEC_PREPAID_FLAT_202606_V1",
                                              "utilityType": "ELECTRICITY",
                                              "billingMode": "PREPAID",
                                              "tariffType": "FLAT",
                                              "version": 1,
                                              "effectiveStartCycle": "2026-06",
                                              "fixedServiceCharge": 0,
                                              "vatRate": 18,
                                              "tiers": []
                                            }
                                            """
                            )
                    }
            )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Tariff created"),
        @ApiResponse(responseCode = "400", description = "Validation error or business rule violation"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<TariffResponse> createTariff(@Valid @RequestBody TariffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tariffService.createTariff(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] List all tariffs (paginated)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Paginated list of tariffs"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<TariffResponse>> listTariffs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tariffService.listTariffs(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Get tariff by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tariff found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Tariff not found")
    })
    public ResponseEntity<TariffResponse> getTariff(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.getTariffById(id));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Deactivate a tariff")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tariff deactivated"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Tariff not found")
    })
    public ResponseEntity<TariffResponse> deactivateTariff(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.deactivateTariff(id));
    }

    @PostMapping("/taxes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Create a tax configuration")
    @RequestBody(
            required = true,
            content = @Content(
                    mediaType = "application/json",
                    examples = @ExampleObject(
                            name = "VAT Configuration",
                            value = """
                                    {
                                      "name": "VAT 18 Water",
                                      "rate": 18,
                                      "utilityType": "WATER",
                                      "effectiveFrom": "2026-06"
                                    }
                                    """
                    )
            )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Tax configuration created"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<TaxConfigurationResponse> createTaxConfig(
            @Valid @RequestBody TaxConfigurationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tariffService.createTaxConfig(request));
    }

    @GetMapping("/taxes")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] List all tax configurations (paginated)")
    public ResponseEntity<Page<TaxConfigurationResponse>> listTaxConfigs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tariffService.listTaxConfigs(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @PatchMapping("/taxes/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Deactivate a tax configuration")
    public ResponseEntity<TaxConfigurationResponse> deactivateTaxConfig(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.deactivateTaxConfig(id));
    }

    @PostMapping("/penalties")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Create a penalty configuration")
    @RequestBody(
            required = true,
            content = @Content(
                    mediaType = "application/json",
                    examples = @ExampleObject(
                            name = "Late Payment Penalty",
                            value = """
                                    {
                                      "name": "Late Payment Penalty",
                                      "rate": 5,
                                      "gracePeriodDays": 15,
                                      "utilityType": "WATER"
                                    }
                                    """
                    )
            )
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Penalty configuration created"),
        @ApiResponse(responseCode = "400", description = "Validation error"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<PenaltyConfigurationResponse> createPenaltyConfig(
            @Valid @RequestBody PenaltyConfigurationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tariffService.createPenaltyConfig(request));
    }

    @GetMapping("/penalties")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] List all penalty configurations (paginated)")
    public ResponseEntity<Page<PenaltyConfigurationResponse>> listPenaltyConfigs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(tariffService.listPenaltyConfigs(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @PatchMapping("/penalties/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Deactivate a penalty configuration")
    public ResponseEntity<PenaltyConfigurationResponse> deactivatePenaltyConfig(@PathVariable UUID id) {
        return ResponseEntity.ok(tariffService.deactivatePenaltyConfig(id));
    }
}
