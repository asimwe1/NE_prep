package com.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.template.dto.ForgotPasswordRequest;
import com.template.dto.LoginRequest;
import com.template.dto.RegisterRequest;
import com.template.entity.Role;
import com.template.entity.User;
import com.template.entity.UserStatus;
import com.template.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;

    @Value("${app.admin.default-password}")
    String adminPassword;

    @Test
    void registerValidUser_returns201() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("test_" + System.currentTimeMillis() + "@example.com");
        req.setPassword("SecurePass1!");
        req.setFullName("John Doe");
        req.setPhoneNumber("+250780000001");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void loginWithBadCredentials_returns401() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("nobody@example.com");
        req.setPassword("wrongpassword");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void registerValidUser_createsInactiveCustomerWithPhoneNumber() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("customer_" + System.currentTimeMillis() + "@example.com");
        req.setPassword("SecurePass1!");
        req.setFullName("Utility Customer");
        req.setPhoneNumber("+250780000002");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        User user = userRepository.findByEmail(req.getEmail()).orElseThrow();
        org.assertj.core.api.Assertions.assertThat(user.getFullName()).isEqualTo("Utility Customer");
        org.assertj.core.api.Assertions.assertThat(user.getPhoneNumber()).isEqualTo("+250780000002");
        org.assertj.core.api.Assertions.assertThat(user.getRole()).isEqualTo(Role.ROLE_CUSTOMER);
        org.assertj.core.api.Assertions.assertThat(user.getStatus()).isEqualTo(UserStatus.INACTIVE);
    }

    @Test
    void loginWithDefaultAdmin_returns200() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("ADMIN@EXAMPLE.COM");
        req.setPassword(adminPassword);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.user.email").value("admin@example.com"))
                .andExpect(jsonPath("$.user.role").value("ROLE_ADMIN"))
                .andExpect(jsonPath("$.user.status").value("ACTIVE"))
                .andExpect(jsonPath("$.user.phoneNumber").value("+250780000000"));
    }

    @Test
    void protectedEndpointWithoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/items"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminEndpointWithAdminToken_returns200() throws Exception {
        String token = loginAsAdmin();

        mockMvc.perform(get("/api/v1/admin/users")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void forgotPasswordWithExistingEmail_returns200WithoutSmtp() throws Exception {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("admin@example.com");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.actionUrl").exists());
    }

    @Test
    void forgotPasswordWithUnknownEmail_returns404() throws Exception {
        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("missing@example.com");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void registerWithInvalidEmail_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("not-an-email");
        req.setPassword("SecurePass1!");
        req.setFullName("Jane Doe");
        req.setPhoneNumber("+250780000003");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    private String loginAsAdmin() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("admin@example.com");
        req.setPassword(adminPassword);

        String response = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("accessToken").asText();
    }
}
