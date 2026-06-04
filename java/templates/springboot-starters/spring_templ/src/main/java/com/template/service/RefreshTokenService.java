package com.template.service;

import com.template.entity.RefreshToken;
import com.template.entity.User;
import com.template.exception.InvalidTokenException;
import com.template.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpiration;

 
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Find an existing token for the user, or create a brand new container if none exists
        RefreshToken token = refreshTokenRepository.findByUser(user)
                .orElseGet(RefreshToken::new);

        // Update the values on the single slot record
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiryDate(Instant.now().plusMillis(refreshExpiration));

        // Hibernate will issue a clean UPDATE if it existed, or an INSERT if it's new
        return refreshTokenRepository.save(token);
    }

    
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isExpired()) {
            refreshTokenRepository.delete(token);
            throw new InvalidTokenException("Refresh token expired. Please log in again.");
        }
        return token;
    }

    public RefreshToken findByToken(String token) {
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));
    }

    @Transactional
    public void deleteByUser(User user) {
        refreshTokenRepository.deleteByUser(user);
    }
}
