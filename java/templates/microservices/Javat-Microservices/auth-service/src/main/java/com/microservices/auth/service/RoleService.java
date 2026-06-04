package com.microservices.auth.service;

import com.microservices.auth.entity.User;
import com.microservices.auth.repository.UserRepository;
import com.microservices.common.constants.SecurityConstants;
import com.microservices.common.exception.BusinessException;
import com.microservices.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Service for role management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoleService {

    private final UserRepository userRepository;

    // Valid roles
    private static final Set<String> VALID_ROLES = new HashSet<>(Arrays.asList(
            SecurityConstants.ROLE_USER,
            SecurityConstants.ROLE_ADMIN,
            SecurityConstants.ROLE_MANAGER,
            SecurityConstants.ROLE_MODERATOR
    ));

    /**
     * Add role to user
     */
    @Transactional
    public Set<String> addRoleToUser(String username, String role) {
        log.info("Adding role '{}' to user: {}", role, username);

        // Validate role
        validateRole(role);

        // Find user
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Check if user already has role
        if (user.hasRole(role)) {
            throw new BusinessException(
                    String.format("User already has role '%s'", role),
                    "ROLE_EXISTS",
                    HttpStatus.CONFLICT
            );
        }

        // Add role
        user.addRole(role);
        userRepository.save(user);

        log.info("Role '{}' added to user: {}", role, username);
        return user.getRoles();
    }

    /**
     * Remove role from user
     */
    @Transactional
    public Set<String> removeRoleFromUser(String username, String role) {
        log.info("Removing role '{}' from user: {}", role, username);

        // Validate role
        validateRole(role);

        // Find user
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // Check if user has the role
        if (!user.hasRole(role)) {
            throw new BusinessException(
                    String.format("User does not have role '%s'", role),
                    "ROLE_NOT_FOUND",
                    HttpStatus.NOT_FOUND
            );
        }

        // Prevent removing last role
        if (user.getRoles().size() == 1) {
            throw new BusinessException(
                    "Cannot remove the last role from user",
                    "LAST_ROLE",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Remove role
        user.getRoles().remove(role);
        userRepository.save(user);

        log.info("Role '{}' removed from user: {}", role, username);
        return user.getRoles();
    }

    /**
     * Get user's roles
     */
    @Transactional(readOnly = true)
    public Set<String> getUserRoles(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return new HashSet<>(user.getRoles());
    }

    /**
     * Check if user has specific role
     */
    @Transactional(readOnly = true)
    public boolean userHasRole(String username, String role) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return user.hasRole(role);
    }

    /**
     * Validate role
     */
    private void validateRole(String role) {
        if (role == null || role.trim().isEmpty()) {
            throw new BusinessException("Role cannot be empty", "INVALID_ROLE", HttpStatus.BAD_REQUEST);
        }

        if (!VALID_ROLES.contains(role)) {
            throw new BusinessException(
                    String.format("Invalid role '%s'. Valid roles are: %s", role, VALID_ROLES),
                    "INVALID_ROLE",
                    HttpStatus.BAD_REQUEST
            );
        }
    }
}
