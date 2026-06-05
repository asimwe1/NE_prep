package com.template.controller;

import com.template.dto.PaymentRequest;
import com.template.dto.PaymentResponse;
import com.template.service.PaymentService;
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
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment processing and management")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @PreAuthorize("hasRole('FINANCE')")
    @Operation(summary = "Record a payment against a bill")
    public ResponseEntity<PaymentResponse> record(@Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.recordPayment(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('FINANCE')")
    @Operation(summary = "List all payments (paginated)")
    public ResponseEntity<Page<PaymentResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(paymentService.listPayments(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/bill/{billId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE')")
    @Operation(summary = "List payments for a specific bill (paginated)")
    public ResponseEntity<Page<PaymentResponse>> getByBill(
            @PathVariable UUID billId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                paymentService.getPaymentsByBill(billId, PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }
}
