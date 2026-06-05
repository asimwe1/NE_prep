package com.template.service;

import com.template.dto.*;
import com.template.entity.RefreshToken;
import com.template.entity.Role;
import com.template.entity.User;
import com.template.entity.UserStatus;
import com.template.exception.*;
import com.template.repository.UserRepository;
import com.template.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;
    private final RefreshTokenService refreshTokenService;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    @Value("${app.verification-token-expiry}")
    private int verificationTokenExpiryMinutes;

    @Value("${app.password-reset-token-expiry}")
    private int passwordResetTokenExpiryMinutes;

    //Register a new user and send verification email

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phoneNumber(request.getPhoneNumber().trim())
                .role(Role.ROLE_CUSTOMER)
                .status(UserStatus.INACTIVE)   // must verify email first
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusMinutes(verificationTokenExpiryMinutes))
                .build();

        userRepository.save(user);
        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), verificationToken);

        log.info("New user registered: {}", user.getEmail());
        return MessageResponse.of("Registration successful! Please check your email to verify your account.");
    }

    // Verify Email 

    @Transactional
    public MessageResponse verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid verification token"));

        if (user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Verification token has expired. Please request a new one.");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstName());
        return MessageResponse.of("Email verified successfully! You can now log in.");
    }

    // Login
    @Transactional 
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = (User) auth.getPrincipal();
        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return buildAuthResponse(accessToken, refreshToken.getToken(), user);
    }

    // Refresh Token
    @Transactional 
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenService.findByToken(request.getRefreshToken());
        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateToken(user);
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        return buildAuthResponse(newAccessToken, newRefreshToken.getToken(), user);
    }

    // Logout

    @Transactional
    public MessageResponse logout(User user) {
        user.setAccessTokensInvalidatedAt(LocalDateTime.now());
        userRepository.save(user);
        refreshTokenService.deleteByUser(user);
        return MessageResponse.of("Logged out successfully.");
    }

    // Forgot Password

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + email));

        String resetToken = UUID.randomUUID().toString();
        user.setPasswordResetToken(resetToken);
        user.setPasswordResetTokenExpiry(LocalDateTime.now().plusMinutes(passwordResetTokenExpiryMinutes));
        userRepository.save(user);
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetToken);

        if (emailService.isLogMode()) {
            return MessageResponse.withActionUrl(
                    "Password reset link generated. Use actionUrl to reset the password.",
                    emailService.buildPasswordResetUrl(resetToken)
            );
        }

        return MessageResponse.of("Password reset email sent.");
    }

    //  Reset Password 

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByPasswordResetToken(request.getToken())
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired reset token"));

        if (user.getPasswordResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Password reset token has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiry(null);
        user.setAccessTokensInvalidatedAt(LocalDateTime.now());
        userRepository.save(user);

        refreshTokenService.deleteByUser(user);
        emailService.sendPasswordChangedEmail(user.getEmail(), user.getFirstName());

        return MessageResponse.of("Password reset successfully. Please log in with your new password.");
    }

    // Change Password
    @Transactional
    public MessageResponse changePassword(User user, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidPasswordException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setAccessTokensInvalidatedAt(LocalDateTime.now());
        userRepository.save(user);

        refreshTokenService.deleteByUser(user);
        emailService.sendPasswordChangedEmail(user.getEmail(), user.getFirstName());

        return MessageResponse.of("Password changed successfully. Please log in again.");
    }

    @Transactional
    public MessageResponse resendVerification(String email) {
        userRepository.findByEmail(email.toLowerCase().trim()).ifPresent(user -> {
            if (!user.isEnabled()) {
                String token = UUID.randomUUID().toString();
                user.setVerificationToken(token);
                user.setVerificationTokenExpiry(LocalDateTime.now().plusMinutes(verificationTokenExpiryMinutes));
                userRepository.save(user);
                emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), token);
            }
        });
        return MessageResponse.of("If that email exists and is unverified, a new verification email has been sent.");
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, User user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration)
                .user(toUserResponse(user))
                .build();
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
