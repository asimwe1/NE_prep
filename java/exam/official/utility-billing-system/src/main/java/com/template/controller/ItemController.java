package com.template.controller;

import com.template.dto.ItemRequest;
import com.template.dto.ItemResponse;
import com.template.entity.User;
import com.template.service.ItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

import java.util.UUID;

/**
 * Example CRUD controller.Class and mapping to match my domain.
 */
@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
@Tag(name = "Items", description = "Sample CRUD resource with simple page/size pagination")
@SecurityRequirement(name = "bearerAuth")
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    @Operation(
            summary = "List all active items",
            description = "Returns active items using simple pagination. Use only page and size; sort/category filters are not required."
    )
    public ResponseEntity<Page<ItemResponse>> list(
            @Parameter(description = "Zero-based page number", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of records per page", example = "20")
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(itemService.getAll(PageRequest.of(Math.max(page, 0), Math.max(size, 1))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get item by ID")
    public ResponseEntity<ItemResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(itemService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new item", description = "Creates an item for the authenticated user.")
    public ResponseEntity<ItemResponse> create(
            @Valid @RequestBody ItemRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemService.create(request, currentUser));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an item")
    public ResponseEntity<ItemResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody ItemRequest request) {
        return ResponseEntity.ok(itemService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete an item", description = "Marks the item inactive instead of removing the row from PostgreSQL.")
    public ResponseEntity<Map<String, String>> delete(@PathVariable UUID id) {
        itemService.delete(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Item successfully deleted");
        response.put("status", "SUCCESS");
        return ResponseEntity.ok(response);
    }
}
