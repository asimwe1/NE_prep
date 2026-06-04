package com.template.util;

import com.template.entity.Role;
import com.template.entity.User;
import com.template.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds an initial ADMIN user on first application start-up.
 * Change the credentials below or load from environment variables.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@example.com";
    private static final String ADMIN_PASSWORD = "Admin@1234";

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
            User admin = User.builder()
                    .email(ADMIN_EMAIL)
                    .password(passwordEncoder.encode(ADMIN_PASSWORD))
                    .firstName("Super")
                    .lastName("Admin")
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("✅ Default admin created — email: {}, password: {}", ADMIN_EMAIL, ADMIN_PASSWORD);
            log.warn("⚠️  CHANGE THE DEFAULT ADMIN CREDENTIALS IN PRODUCTION!");
        }
    }
}
