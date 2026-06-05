package com.template.controller;

import com.template.dto.*;
import com.template.entity.User;
import com.template.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, token refresh, password management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(
            summary = "[PUBLIC] Register a new user",
            description = "Creates an INACTIVE ROLE_CUSTOMER account with full names, email, phone number, National ID, and password, then sends an email verification link through SMTP. National ID is the customer-facing identifier used later for meters, bills, and notifications. If EMAIL_DELIVERY=log, copy the verification actionUrl from the application logs."
    )
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "[PUBLIC] Verify email address via token", description = "Enables the account after a valid verification token is supplied.")
    public ResponseEntity<MessageResponse> verifyEmail(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "[PUBLIC] Resend email verification link", description = "Generates and sends a new verification link for an unverified account. If EMAIL_DELIVERY=log, the link is printed to the application logs.")
    public ResponseEntity<MessageResponse> resendVerification(@RequestParam String email) {
        return ResponseEntity.ok(authService.resendVerification(email));
    }

    @PostMapping("/login")
    @Operation(summary = "[PUBLIC] Login with email and password", description = "Authenticates an ACTIVE account and returns access and refresh tokens. Email matching is case-insensitive.")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "[PUBLIC] Refresh access token", description = "Exchanges a valid refresh token for a new access token and refresh token.")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }


    @PostMapping("/logout")
    @Operation(summary = "[AUTHENTICATED] Logout", description = "Invalidates the current user's refresh token.", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<MessageResponse> logout(@AuthenticationPrincipal User user) {
        requireAuthenticated(user);
        return ResponseEntity.ok(authService.logout(user));
    }

    @PostMapping("/forgot-password")
    @Operation(
            summary = "[PUBLIC] Request password reset",
            description = "Generates a reset token for an existing account and sends the reset link through SMTP. If EMAIL_DELIVERY=log, the response includes actionUrl and the same URL is printed in the logs. Unknown emails return 404."
    )
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "[PUBLIC] Reset password with token", description = "Sets a new password using the token from the password-reset actionUrl.")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @PostMapping("/change-password")
    @Operation(summary = "[AUTHENTICATED] Change password", description = "Changes the authenticated user's password after checking the current password.", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<MessageResponse> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        requireAuthenticated(user);
        return ResponseEntity.ok(authService.changePassword(user, request));
    }

    @GetMapping("/me")
    @Operation(summary = "[AUTHENTICATED] Get current user profile", description = "Returns the profile represented by the Bearer token.", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal User user) {
        requireAuthenticated(user);
        return ResponseEntity.ok(authService.toUserResponse(user));
    }

    private void requireAuthenticated(User user) {
        if (user == null) {
            throw new AccessDeniedException("Authentication is required");
        }
    }
}
