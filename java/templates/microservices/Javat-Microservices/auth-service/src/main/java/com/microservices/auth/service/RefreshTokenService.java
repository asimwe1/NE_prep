package com.microservices.auth.service;

import com.microservices.auth.entity.RefreshToken;
import com.microservices.auth.entity.User;
import com.microservices.auth.repository.RefreshTokenRepository;
import com.microservices.common.constants.SecurityConstants;
import com.microservices.common.exception.UnauthorizedException;
import com.microservices.common.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for refresh token management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;

    /**
     * Create and store refresh token
     */
    @Transactional
    public RefreshToken createRefreshToken(User user, String tokenString, String deviceInfo, String ipAddress) {
        log.debug("Creating refresh token for user: {}", user.getId());

        LocalDateTime expiresAt = LocalDateTime.now()
                .plusSeconds(SecurityConstants.JWT_REFRESH_TOKEN_VALIDITY / 1000);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(tokenString)
                .user(user)
                .expiresAt(expiresAt)
                .deviceInfo(deviceInfo)
                .ipAddress(ipAddress)
                .revoked(false)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    /**
     * Verify refresh token validity
     */
    @Transactional
    public RefreshToken verifyRefreshToken(String token) {
        log.debug("Verifying refresh token");

        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.getRevoked()) {
            log.warn("Revoked refresh token used: {}", refreshToken.getId());
            throw new UnauthorizedException("Refresh token has been revoked");
        }

        if (refreshToken.isExpired()) {
            log.warn("Expired refresh token used: {}", refreshToken.getId());
            // Auto-delete expired token
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token has expired");
        }

        // Update last used timestamp
        refreshToken.setLastUsedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshToken);

        return refreshToken;
    }

    /**
     * Rotate refresh token (invalidate old, create new)
     * This implements token rotation for enhanced security
     */
    @Transactional
    public RefreshToken rotateRefreshToken(RefreshToken oldToken, String newTokenString, 
                                          String deviceInfo, String ipAddress) {
        log.info("Rotating refresh token for user: {}", oldToken.getUser().getId());

        // Create new token
        RefreshToken newToken = createRefreshToken(
                oldToken.getUser(), 
                newTokenString, 
                deviceInfo, 
                ipAddress
        );

        // Revoke old token and link to new one
        oldToken.revoke();
        oldToken.setReplacedByToken(newTokenString);
        refreshTokenRepository.save(oldToken);

        log.debug("Old token revoked and replaced with new token");

        return newToken;
    }

    /**
     * Revoke single refresh token (logout)
     */
    @Transactional
    public void revokeToken(String token) {
        log.info("Revoking refresh token");

        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        log.info("Refresh token revoked successfully");
    }

    /**
     * Revoke all refresh tokens for a user (logout from all devices)
     */
    @Transactional
    public int revokeAllUserTokens(User user) {
        log.info("Revoking all refresh tokens for user: {}", user.getId());

        int count = refreshTokenRepository.revokeAllByUser(user, LocalDateTime.now());

        log.info("Revoked {} refresh tokens for user: {}", count, user.getId());
        return count;
    }

    /**
     * Get all active tokens for a user
     */
    @Transactional(readOnly = true)
    public List<RefreshToken> getActiveTokens(User user) {
        return refreshTokenRepository.findByUserAndRevokedFalse(user);
    }

    /**
     * Get active token count for a user
     */
    @Transactional(readOnly = true)
    public long getActiveTokenCount(User user) {
        return refreshTokenRepository.countByUserAndRevokedFalse(user);
    }

    /**
     * Delete all tokens for a user (cleanup)
     */
    @Transactional
    public void deleteAllUserTokens(User user) {
        log.info("Deleting all refresh tokens for user: {}", user.getId());
        refreshTokenRepository.deleteAllByUser(user);
    }

    /**
     * Scheduled task to clean up expired tokens
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Running scheduled cleanup of expired refresh tokens");

        int deletedCount = refreshTokenRepository.deleteExpiredTokens(LocalDateTime.now());

        log.info("Cleaned up {} expired refresh tokens", deletedCount);
    }
}
