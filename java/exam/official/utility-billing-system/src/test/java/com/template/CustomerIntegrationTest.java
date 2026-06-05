package com.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.template.dto.CustomerCreateRequest;
import com.template.dto.LoginRequest;
import com.template.dto.RegisterRequest;
import com.template.entity.CustomerStatus;
import com.template.repository.CustomerRepository;
import com.template.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CustomerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired CustomerRepository customerRepository;
    @Autowired UserRepository userRepository;

    @Value("${app.admin.default-password}")
    String adminPassword;

    private static final AtomicLong NID_SEQ = new AtomicLong(1199880100000100L);

    // ─── Create customer ──────────────────────────────────────────────────────

    @Test
    void createCustomer_asAdmin_returns201() throws Exception {
        String token = loginAsAdmin();
        CustomerCreateRequest req = validCustomerCreateRequest(String.valueOf(NID_SEQ.getAndIncrement()));

        mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fullName").value(req.getFullName()))
                .andExpect(jsonPath("$.nationalId").value(req.getNationalId()))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void createCustomer_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/customers")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validCustomerCreateRequest(String.valueOf(NID_SEQ.getAndIncrement())))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createCustomer_duplicateNationalId_returns409() throws Exception {
        String token = loginAsAdmin();
        CustomerCreateRequest req = validCustomerCreateRequest(String.valueOf(NID_SEQ.getAndIncrement()));

        // Create once
        mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Same NID — must conflict
        mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void createCustomer_invalidName_withDigits_returns400() throws Exception {
        String token = loginAsAdmin();
        CustomerCreateRequest req = validCustomerCreateRequest(String.valueOf(NID_SEQ.getAndIncrement()));
        req.setFullName("J0hn D0e123");

        mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.fullName").exists());
    }

    @Test
    void createCustomer_invalidNationalId_withLetters_returns400() throws Exception {
        String token = loginAsAdmin();
        CustomerCreateRequest req = validCustomerCreateRequest(String.valueOf(NID_SEQ.getAndIncrement()));
        req.setNationalId("119988ABCD123456");

        mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.nationalId").exists());
    }

    @Test
    void createCustomer_invalidPhone_returns400() throws Exception {
        String token = loginAsAdmin();
        CustomerCreateRequest req = validCustomerCreateRequest(String.valueOf(NID_SEQ.getAndIncrement()));
        req.setPhoneNumber("0123456789");

        mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.phoneNumber").exists());
    }

    // ─── Activate / Deactivate ────────────────────────────────────────────────

    @Test
    void deactivateCustomer_thenStatusIsInactive() throws Exception {
        String token = loginAsAdmin();
        CustomerCreateRequest req = validCustomerCreateRequest(String.valueOf(NID_SEQ.getAndIncrement()));

        String createBody = mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createBody).get("customerId").asText();

        mockMvc.perform(patch("/api/v1/customers/" + id + "/deactivate")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        assertThat(customerRepository.findById(java.util.UUID.fromString(id))
                .orElseThrow().getStatus()).isEqualTo(CustomerStatus.INACTIVE);
    }

    @Test
    void activateCustomer_setsStatusActive() throws Exception {
        String token = loginAsAdmin();
        CustomerCreateRequest req = validCustomerCreateRequest(String.valueOf(NID_SEQ.getAndIncrement()));

        String createBody = mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String id = objectMapper.readTree(createBody).get("customerId").asText();

        // Deactivate first
        mockMvc.perform(patch("/api/v1/customers/" + id + "/deactivate")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // Re-activate
        mockMvc.perform(patch("/api/v1/customers/" + id + "/activate")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    // ─── List / Get ───────────────────────────────────────────────────────────

    @Test
    void listCustomers_asAdmin_returnsPaginatedList() throws Exception {
        String token = loginAsAdmin();

        mockMvc.perform(get("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    @Test
    void createCustomerWithExistingUserId_thenGetByUserId_returnsCustomer() throws Exception {
        String token = loginAsAdmin();
        String email = "linked_customer_" + System.nanoTime() + "@example.com";
        String nationalId = String.valueOf(NID_SEQ.getAndIncrement());
        RegisterRequest register = new RegisterRequest();
        register.setEmail(email);
        register.setPassword("SecurePass1!");
        register.setFullName("Linked Customer");
        register.setPhoneNumber("+250788000002");
        register.setNationalId(nationalId);

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isCreated());

        String userId = userRepository.findByEmail(email).orElseThrow().getId().toString();
        CustomerCreateRequest customer = validCustomerCreateRequest(nationalId);
        customer.setUserId(java.util.UUID.fromString(userId));

        mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(customer)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.fullName").value("Linked Customer"))
                .andExpect(jsonPath("$.email").value(email));

        mockMvc.perform(get("/api/v1/customers/" + userId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.nationalId").value(customer.getNationalId()));

        mockMvc.perform(get("/api/v1/customers/national-id/" + nationalId)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(userId))
                .andExpect(jsonPath("$.nationalId").value(nationalId));
    }

    private CustomerCreateRequest validCustomerCreateRequest(String nationalId) {
        CustomerCreateRequest req = new CustomerCreateRequest();
        req.setFullName("Kagabo Jean");
        req.setNationalId(nationalId);
        req.setEmail("kagabo" + System.nanoTime() + "@example.com");
        req.setPhoneNumber("+250788000001");
        req.setAddress("KG 123 St, Kigali");
        req.setDistrict("Gasabo");
        return req;
    }

    private String loginAsAdmin() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setEmail("admin@example.com");
        req.setPassword(adminPassword);

        String response = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(response).get("accessToken").asText();
    }
}
