package com.microservices.auth.service;

import com.microservices.auth.dto.*;
import com.microservices.auth.entity.RefreshToken;
import com.microservices.auth.entity.User;
import com.microservices.auth.repository.UserRepository;
import com.microservices.common.constants.SecurityConstants;
import com.microservices.common.exception.BusinessException;
import com.microservices.common.exception.UnauthorizedException;
import com.microservices.common.security.JwtUtil;
import com.microservices.common.security.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for authentication operations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    /**
     * Register a new user
     */
    @Transactional
    public AuthResponse register(RegisterRequest request, String deviceInfo, String ipAddress) {
        log.info("Registering new user: {}", request.getUsername());

        // Check if username exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException(
                    "Username already exists",
                    "USERNAME_EXISTS",
                    HttpStatus.CONFLICT
            );
        }

        // Check if email exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(
                    "Email already exists",
                    "EMAIL_EXISTS",
                    HttpStatus.CONFLICT
            );
        }

        // Create user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(PasswordUtil.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .enabled(true)
                .build();

        // Add default role
        user.addRole(SecurityConstants.ROLE_USER);

        // Save user
        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getId());

        // Generate tokens
        return generateAuthResponse(savedUser, deviceInfo, ipAddress);
    }

    /**
     * Login user
     */
    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo, String ipAddress) {
        log.info("Login attempt for: {}", request.getUsernameOrEmail());

        // Find user
        User user = userRepository.findByUsernameOrEmail(
                        request.getUsernameOrEmail(),
                        request.getUsernameOrEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid username/email or password"));

        // Verify password
        if (!PasswordUtil.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid username/email or password");
        }

        // Check if user is enabled
        if (!user.getEnabled()) {
            throw new UnauthorizedException("Account is disabled");
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in successfully: {}", user.getId());

        // Generate tokens
        return generateAuthResponse(user, deviceInfo, ipAddress);
    }

    /**
     * Refresh access token with token rotation
     */
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request, String deviceInfo, String ipAddress) {
        log.info("Refreshing access token");

        String oldRefreshToken = request.getRefreshToken();

        try {
            // Verify refresh token
            RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(oldRefreshToken);
            User user = refreshToken.getUser();

            // Generate new tokens
            List<String> roles = new ArrayList<>(user.getRoles());
            
            // Generate new access token
            String newAccessToken = jwtUtil.generateAccessToken(
                    user.getUsername(),
                    user.getId(),
                    roles
            );

            // Generate new refresh token
            String newRefreshTokenString = jwtUtil.generateRefreshToken(
                    user.getUsername(),
                    user.getId()
            );

            // Rotate refresh token (revoke old, create new)
            RefreshToken newRefreshToken = refreshTokenService.rotateRefreshToken(
                    refreshToken,
                    newRefreshTokenString,
                    deviceInfo,
                    ipAddress
            );

            log.info("Tokens refreshed successfully for user: {}", user.getId());

            // Build response
            AuthResponse.UserDTO userDTO = AuthResponse.UserDTO.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .roles(user.getRoles())
                    .build();

            return AuthResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken.getToken())
                    .tokenType("Bearer")
                    .expiresIn(SecurityConstants.JWT_ACCESS_TOKEN_VALIDITY)
                    .user(userDTO)
                    .build();

        } catch (Exception e) {
            log.error("Failed to refresh token: {}", e.getMessage());
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
    }

    /**
     * Logout user (revoke refresh token)
     */
    @Transactional
    public void logout(LogoutRequest request) {
        log.info("Logout request received");
        
        try {
            refreshTokenService.revokeToken(request.getRefreshToken());
            log.info("User logged out successfully");
        } catch (Exception e) {
            log.error("Logout failed: {}", e.getMessage());
            throw new UnauthorizedException("Invalid refresh token");
        }
    }

    /**
     * Logout from all devices (revoke all user's refresh tokens)
     */
    @Transactional
    public void logoutAll(String username) {
        log.info("Logout all devices for user: {}", username);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        int revokedCount = refreshTokenService.revokeAllUserTokens(user);
        
        log.info("Logged out from {} devices for user: {}", revokedCount, username);
    }

    /**
     * Get active sessions count
     */
    @Transactional(readOnly = true)
    public long getActiveSessionsCount(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return refreshTokenService.getActiveTokenCount(user);
    }

    /**
     * Generate authentication response with tokens
     */
    private AuthResponse generateAuthResponse(User user, String deviceInfo, String ipAddress) {
        // Generate access token
        List<String> roles = new ArrayList<>(user.getRoles());
        String accessToken = jwtUtil.generateAccessToken(
                user.getUsername(),
                user.getId(),
                roles
        );

        // Generate refresh token string
        String refreshTokenString = jwtUtil.generateRefreshToken(
                user.getUsername(),
                user.getId()
        );

        // Store refresh token
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(
                user,
                refreshTokenString,
                deviceInfo,
                ipAddress
        );

        // Build user DTO
        AuthResponse.UserDTO userDTO = AuthResponse.UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .roles(user.getRoles())
                .build();

        // Build response
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(SecurityConstants.JWT_ACCESS_TOKEN_VALIDITY)
                .user(userDTO)
                .build();
    }
}
