package com.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.template.dto.*;
import com.template.entity.BillingMode;
import com.template.entity.CompanyType;
import com.template.entity.TariffType;
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
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BillIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Value("${app.admin.default-password}")
    String adminPassword;

    private String adminToken;
    private static final AtomicLong NID_SEQ   = new AtomicLong(1199880400000100L);
    private static final AtomicLong METER_SEQ = new AtomicLong(2000L);

    @BeforeEach
    void setUp() throws Exception {
        adminToken = loginAsAdmin();
    }

    // ─── Generate bill ────────────────────────────────────────────────────────

    @Test
    void generateBill_withActiveCustomerAndReading_returns201() throws Exception {
        // Set up the full billing chain — use current month so tariff effectiveStartCycle matches
        UUID customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));
        UUID meterId = createMeter("MTR-BILL-A" + METER_SEQ.getAndIncrement(), customerId);
        createTariff("BILL-WATER-T01", UtilityType.WATER, BillingMode.POSTPAID);
        YearMonth billingMonth = YearMonth.now();
        captureReading(meterId, new BigDecimal("300.000"), billingMonth);

        BillGenerateRequest req = new BillGenerateRequest();
        req.setMeterId(meterId);
        req.setBillingMonth(billingMonth);

        mockMvc.perform(post("/api/v1/bills/generate")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.balance").isNumber())
                .andExpect(jsonPath("$.billNumber").isString());
    }

    @Test
    void generateBill_inactiveCustomer_returns400() throws Exception {
        UUID customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));
        UUID meterId = createMeter("MTR-BILL-B" + METER_SEQ.getAndIncrement(), customerId);
        createTariff("BILL-ELEC-T01", UtilityType.WATER, BillingMode.POSTPAID);
        YearMonth billingMonth = YearMonth.now();
        captureReading(meterId, new BigDecimal("200.000"), billingMonth);

        // Deactivate customer
        mockMvc.perform(patch("/api/v1/customers/" + customerId + "/deactivate")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        BillGenerateRequest req = new BillGenerateRequest();
        req.setMeterId(meterId);
        req.setBillingMonth(billingMonth);

        mockMvc.perform(post("/api/v1/bills/generate")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void generateBill_futureBillingMonth_returns400() throws Exception {
        UUID customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));
        UUID meterId = createMeter("MTR-BILL-C" + METER_SEQ.getAndIncrement(), customerId);

        BillGenerateRequest req = new BillGenerateRequest();
        req.setMeterId(meterId);
        req.setBillingMonth(YearMonth.now().plusMonths(1));

        mockMvc.perform(post("/api/v1/bills/generate")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void generateBill_withoutToken_returns401() throws Exception {
        BillGenerateRequest req = new BillGenerateRequest();
        req.setMeterId(UUID.randomUUID());
        req.setBillingMonth(YearMonth.now().minusMonths(1));

        mockMvc.perform(post("/api/v1/bills/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    // ─── List / Get bills ─────────────────────────────────────────────────────

    @Test
    void listBills_asAdmin_returnsPage() throws Exception {
        mockMvc.perform(get("/api/v1/bills")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getBillsByCustomer_returnsCustomerBills() throws Exception {
        UUID customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));

        mockMvc.perform(get("/api/v1/bills/customer/" + customerId)
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private UUID createCustomer(String nationalId) throws Exception {
        CustomerCreateRequest req = new CustomerCreateRequest();
        req.setFullName("Habimana Paul");
        req.setNationalId(nationalId);
        req.setEmail("paul" + System.nanoTime() + "@example.com");
        req.setPhoneNumber("+250788000004");
        req.setAddress("KG 7 St, Kigali");
        req.setDistrict("Kicukiro");

        String body = mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();

        return UUID.fromString(objectMapper.readTree(body).get("customerId").asText());
    }

    private UUID createMeter(String meterNumber, UUID customerId) throws Exception {
        MeterRequest req = new MeterRequest();
        req.setMeterNumber(meterNumber);
        req.setUtilityType(UtilityType.WATER);
        req.setBillingMode(BillingMode.POSTPAID);
        req.setCompanyType(CompanyType.WASAC);
        req.setCustomerId(customerId);
        req.setInstallationDate(LocalDate.now());
        req.setInstallationAddress("KG 1 Ave, Kigali");

        String body = mockMvc.perform(post("/api/v1/meters")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();

        return UUID.fromString(objectMapper.readTree(body).get("id").asText());
    }

    private void createTariff(String code, UtilityType type, BillingMode mode) throws Exception {
        TariffTierRequest tier = new TariffTierRequest();
        tier.setTierMin(BigDecimal.ZERO);
        tier.setTierMax(new BigDecimal("99999"));
        tier.setUnitPrice(new BigDecimal("250.00"));

        TariffRequest req = new TariffRequest();
        req.setTariffCode(code);
        req.setUtilityType(type);
        req.setBillingMode(mode);
        req.setTariffType(TariffType.FLAT);
        req.setVersion(1);
        req.setEffectiveStartCycle(YearMonth.now());
        req.setFixedServiceCharge(new BigDecimal("500.00"));
        req.setVatRate(new BigDecimal("18.00"));
        req.setTiers(List.of(tier));

        mockMvc.perform(post("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)));
    }

    private void captureReading(UUID meterId, BigDecimal current, YearMonth billingMonth) throws Exception {
        MeterReadingRequest req = new MeterReadingRequest();
        req.setMeterId(meterId);
        req.setCurrentReading(current);
        req.setReadingDate(LocalDate.now());
        req.setBillingMonth(billingMonth);

        mockMvc.perform(post("/api/v1/readings")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)));
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
