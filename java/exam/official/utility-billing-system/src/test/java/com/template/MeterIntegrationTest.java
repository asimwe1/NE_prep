package com.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.template.dto.CustomerRequest;
import com.template.dto.LoginRequest;
import com.template.dto.MeterRequest;
import com.template.entity.BillingMode;
import com.template.entity.CompanyType;
import com.template.entity.UtilityType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MeterIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Value("${app.admin.default-password}")
    String adminPassword;

    private String adminToken;
    private UUID customerId;

    /** Generates unique 16-digit NIDs to avoid conflicts across test runs. */
    private static final AtomicLong NID_SEQ = new AtomicLong(1199880200000100L);

    @BeforeEach
    void setUp() throws Exception {
        adminToken = loginAsAdmin();
        customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));
    }

    // ─── Assign meter ─────────────────────────────────────────────────────────

    @Test
    void assignMeter_asAdmin_returns201() throws Exception {
        MeterRequest req = validMeterRequest("MTR-WATER-0001", customerId);

        mockMvc.perform(post("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.meterNumber").value("MTR-WATER-0001"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void assignMeter_duplicateMeterNumber_returns409() throws Exception {
        MeterRequest req = validMeterRequest("MTR-WATER-DUP1", customerId);

        mockMvc.perform(post("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void assignMeter_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/meters")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validMeterRequest("MTR-NOAUTH-01", customerId))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void assignMeter_invalidMeterNumber_lowercase_returns400() throws Exception {
        MeterRequest req = validMeterRequest("mtr-lower-001", customerId);

        mockMvc.perform(post("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.meterNumber").exists());
    }

    @Test
    void assignMeter_futureInstallationDate_returns400() throws Exception {
        MeterRequest req = validMeterRequest("MTR-FUTURE-001", customerId);
        req.setInstallationDate(LocalDate.now().plusDays(10));

        mockMvc.perform(post("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ─── List meters ─────────────────────────────────────────────────────────

    @Test
    void listMeters_asAdmin_returnsPage() throws Exception {
        mockMvc.perform(get("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void listMetersByCustomer_returnsMetersForThatCustomer() throws Exception {
        MeterRequest req = validMeterRequest("MTR-CUSTLIST-001", customerId);
        mockMvc.perform(post("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/meters/customer/" + customerId)
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    // ─── Activate / Deactivate ────────────────────────────────────────────────

    @Test
    void deactivateMeter_setsStatusInactive() throws Exception {
        MeterRequest req = validMeterRequest("MTR-DEACT-001", customerId);
        String body = mockMvc.perform(post("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String meterId = objectMapper.readTree(body).get("id").asText();

        mockMvc.perform(patch("/api/v1/meters/" + meterId + "/deactivate")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private MeterRequest validMeterRequest(String meterNumber, UUID customerId) {
        MeterRequest req = new MeterRequest();
        req.setMeterNumber(meterNumber);
        req.setUtilityType(UtilityType.WATER);
        req.setBillingMode(BillingMode.POSTPAID);
        req.setCompanyType(CompanyType.WASAC);
        req.setCustomerId(customerId);
        req.setInstallationDate(LocalDate.now());
        req.setInstallationAddress("KG 50 St, Kigali");
        return req;
    }

    private UUID createCustomer(String nationalId) throws Exception {
        CustomerRequest req = new CustomerRequest();
        req.setFullName("Mukamana Alice");
        req.setNationalId(nationalId);
        req.setEmail("alice" + System.nanoTime() + "@example.com");
        req.setPhoneNumber("+250788000002");
        req.setAddress("KN 5 Ave, Kigali");
        req.setDistrict("Nyarugenge");

        String body = mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();

        return UUID.fromString(objectMapper.readTree(body).get("id").asText());
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
