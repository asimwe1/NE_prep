package com.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.template.dto.CustomerCreateRequest;
import com.template.dto.LoginRequest;
import com.template.dto.MeterReadingRequest;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MeterReadingIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Value("${app.admin.default-password}")
    String adminPassword;

    private String adminToken;
    private UUID activeMeterIdA;
    private UUID activeMeterIdB;

    private static final AtomicLong NID_SEQ     = new AtomicLong(1199880300000100L);
    private static final AtomicLong METER_SEQ   = new AtomicLong(1000L);

    @BeforeEach
    void setUp() throws Exception {
        adminToken = loginAsAdmin();
        UUID customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));
        long seq = METER_SEQ.getAndIncrement();
        activeMeterIdA = createMeter("MTR-READ-A" + seq, customerId);
        activeMeterIdB = createMeter("MTR-READ-B" + seq, customerId);
    }

    // ─── Capture reading ──────────────────────────────────────────────────────

    @Test
    void captureReading_validRequest_returns201() throws Exception {
        MeterReadingRequest req = readingRequest(activeMeterIdA, new BigDecimal("120.000"),
                YearMonth.now().minusMonths(1));

        mockMvc.perform(post("/api/v1/readings")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.currentReading").value(120.0))
                .andExpect(jsonPath("$.consumption").value(120.0));
    }

    @Test
    void captureReading_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/readings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        readingRequest(activeMeterIdA, new BigDecimal("50.000"), YearMonth.now().minusMonths(2)))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void captureReading_duplicateMonth_returns409() throws Exception {
        YearMonth month = YearMonth.now().minusMonths(1);
        MeterReadingRequest req = readingRequest(activeMeterIdB, new BigDecimal("200.000"), month);

        // First capture succeeds
        mockMvc.perform(post("/api/v1/readings")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Second capture for same meter + month conflicts
        req.setCurrentReading(new BigDecimal("210.000"));
        mockMvc.perform(post("/api/v1/readings")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    void captureReading_currentNotGreaterThanPrevious_returns400() throws Exception {
        // First reading: current = 500
        mockMvc.perform(post("/api/v1/readings")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        readingRequest(activeMeterIdA, new BigDecimal("500.000"), YearMonth.now().minusMonths(3)))))
                .andExpect(status().isCreated());

        // Second reading: current = 400 (less than previous 500) — must fail
        mockMvc.perform(post("/api/v1/readings")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        readingRequest(activeMeterIdA, new BigDecimal("400.000"), YearMonth.now().minusMonths(2)))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void captureReading_futureBillingMonth_returns400() throws Exception {
        MeterReadingRequest req = readingRequest(activeMeterIdA, new BigDecimal("100.000"),
                YearMonth.now().plusMonths(1));

        mockMvc.perform(post("/api/v1/readings")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void captureReading_inactiveMeter_returns400() throws Exception {
        // Deactivate the meter first
        mockMvc.perform(patch("/api/v1/meters/" + activeMeterIdA + "/deactivate")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/readings")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        readingRequest(activeMeterIdA, new BigDecimal("100.000"), YearMonth.now().minusMonths(1)))))
                .andExpect(status().isBadRequest());
    }

    // ─── List readings ────────────────────────────────────────────────────────

    @Test
    void listReadings_asAdmin_returnsPage() throws Exception {
        mockMvc.perform(get("/api/v1/readings")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private MeterReadingRequest readingRequest(UUID meterId, BigDecimal current, YearMonth billingMonth) {
        MeterReadingRequest req = new MeterReadingRequest();
        req.setMeterId(meterId);
        req.setCurrentReading(current);
        req.setReadingDate(LocalDate.now());
        req.setBillingMonth(billingMonth);
        return req;
    }

    private UUID createMeter(String meterNumber, UUID customerId) throws Exception {
        MeterRequest req = new MeterRequest();
        req.setMeterNumber(meterNumber);
        req.setUtilityType(UtilityType.WATER);
        req.setBillingMode(BillingMode.POSTPAID);
        req.setCompanyType(CompanyType.WASAC);
        req.setCustomerId(customerId);
        req.setInstallationDate(LocalDate.now());
        req.setInstallationAddress("KG 1 St, Kigali");

        String body = mockMvc.perform(post("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();

        return UUID.fromString(objectMapper.readTree(body).get("id").asText());
    }

    private UUID createCustomer(String nationalId) throws Exception {
        CustomerCreateRequest req = new CustomerCreateRequest();
        req.setFullName("Nshimiyimana Eric");
        req.setNationalId(nationalId);
        req.setEmail("eric" + System.nanoTime() + "@example.com");
        req.setPhoneNumber("+250788000003");
        req.setAddress("KN 10 Ave, Kigali");
        req.setDistrict("Gasabo");

        String body = mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();

        return UUID.fromString(objectMapper.readTree(body).get("customerId").asText());
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
