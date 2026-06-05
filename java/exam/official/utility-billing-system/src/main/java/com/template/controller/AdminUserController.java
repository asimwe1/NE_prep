package com.template.controller;

import com.template.dto.UserResponse;
import com.template.entity.User;
import com.template.exception.ResourceNotFoundException;
import com.template.repository.UserRepository;
import com.template.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Users", description = "Admin-only user management with simple page/size pagination")
@SecurityRequirement(name = "bearerAuth")
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    @GetMapping
    @Operation(
            summary = "List all users",
            description = "Returns users using simple pagination. Use only page and size; sort parameters are intentionally not exposed."
    )
    public ResponseEntity<Page<UserResponse>> listUsers(
            @Parameter(description = "Zero-based page number", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Number of records per page", example = "20")
            @RequestParam(defaultValue = "20") int size) {
        Page<UserResponse> users = userRepository.findAll(PageRequest.of(Math.max(page, 0), Math.max(size, 1)))
                .map(authService::toUserResponse);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserResponse> getUser(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PatchMapping("/{id}/enable")
    @Operation(summary = "Enable a user account")
    public ResponseEntity<UserResponse> enableUser(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setEnabled(true);
        userRepository.save(user);
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @PatchMapping("/{id}/disable")
    @Operation(summary = "Disable a user account")
    public ResponseEntity<UserResponse> disableUser(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setEnabled(false);
        userRepository.save(user);
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a user")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
