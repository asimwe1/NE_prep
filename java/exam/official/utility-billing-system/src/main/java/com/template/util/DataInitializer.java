package com.template.util;

import com.template.entity.Role;
import com.template.entity.User;
import com.template.entity.UserStatus;
import com.template.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds an initial ADMIN user on first application startup.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@example.com";

    @Value("${app.admin.default-password:change-me-before-running}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
            User admin = User.builder()
                    .email(ADMIN_EMAIL)
                    .password(passwordEncoder.encode(adminPassword))
                    .fullName("Super Admin")
                    .phoneNumber("+250780000000")
                    .role(Role.ROLE_ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(admin);
            log.info("Default admin created for email: {}", ADMIN_EMAIL);
            log.warn("Change the default admin password before using this template in production.");
        }
    }
}
