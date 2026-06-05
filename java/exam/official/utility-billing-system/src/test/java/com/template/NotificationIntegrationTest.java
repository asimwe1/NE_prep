package com.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.template.dto.*;
import com.template.entity.BillingMode;
import com.template.entity.CompanyType;
import com.template.entity.TariffType;
import com.template.entity.UtilityType;
import com.template.repository.BillRepository;
import com.template.repository.CustomerNotificationRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired CustomerNotificationRepository notificationRepository;
    @Autowired BillRepository billRepository;

    @Value("${app.admin.default-password}")
    String adminPassword;

    private String adminToken;
    private static final AtomicLong NID_SEQ   = new AtomicLong(1199880600000100L);
    private static final AtomicLong METER_SEQ = new AtomicLong(4000L);

    @BeforeEach
    void setUp() throws Exception {
        adminToken = loginAsAdmin();
    }

    // ─── Bill generation creates notification ─────────────────────────────────

    @Test
    void generateBill_createsNotification_inDatabase() throws Exception {
        UUID customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));
        long s = METER_SEQ.getAndIncrement();
        UUID meterId = createMeter("MTR-NOTIF-A" + s, customerId);
        createTariff("NOTIF-TARIFF-A" + s, UtilityType.WATER, BillingMode.POSTPAID);
        captureReading(meterId, new BigDecimal("400.000"), YearMonth.now());

        long beforeCount = notificationRepository.count();

        BillGenerateRequest req = new BillGenerateRequest();
        req.setMeterId(meterId);
        req.setBillingMonth(YearMonth.now());

        mockMvc.perform(post("/api/v1/bills/generate")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // One BILL_GENERATED notification must have been created
        assertThat(notificationRepository.count()).isGreaterThan(beforeCount);
    }

    @Test
    void fullPayment_createsPaymentNotification() throws Exception {
        String billId = createBillForTest("1199880600000002", "MTR-NOTIF-B001", "NOTIF-TARIFF-B01");
        BigDecimal billBalance = getBillBalance(billId);

        long beforeCount = notificationRepository.count();

        PaymentRequest req = new PaymentRequest();
        req.setBillId(UUID.fromString(billId));
        req.setAmount(billBalance);
        req.setPaymentMethod("Mobile Money");
        req.setPaymentReference("NOTIF-PAY-REF-001");

        mockMvc.perform(post("/api/v1/payments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // PAYMENT_RECEIVED notification must have been created
        assertThat(notificationRepository.count()).isGreaterThan(beforeCount);
    }

    @Test
    void partialPayment_doesNotCreatePaymentNotification() throws Exception {
        String billId = createBillForTest("1199880600000003", "MTR-NOTIF-C001", "NOTIF-TARIFF-C01");
        BigDecimal billBalance = getBillBalance(billId);
        BigDecimal partial = billBalance.divide(BigDecimal.valueOf(4), 2, java.math.RoundingMode.HALF_UP);

        long beforeCount = notificationRepository.count();

        PaymentRequest req = new PaymentRequest();
        req.setBillId(UUID.fromString(billId));
        req.setAmount(partial);
        req.setPaymentMethod("Bank Transfer");
        req.setPaymentReference("NOTIF-PAY-PART-001");

        mockMvc.perform(post("/api/v1/payments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // No PAYMENT_RECEIVED notification for partial payment
        assertThat(notificationRepository.count()).isEqualTo(beforeCount);
    }

    // ─── List notifications ───────────────────────────────────────────────────

    @Test
    void listNotifications_asAdmin_returnsPage() throws Exception {
        mockMvc.perform(get("/api/v1/notifications")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void listNotifications_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listNotificationsByCustomer_asAdmin_returnsPage() throws Exception {
        UUID customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));

        mockMvc.perform(get("/api/v1/notifications/customer/" + customerId)
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String createBillForTest(String nationalId, String meterNumber, String tariffCode) throws Exception {
        UUID customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));
        long s = METER_SEQ.getAndIncrement();
        UUID meterId = createMeter("MTR-NOTIF-" + s, customerId);
        createTariff("NOTIF-T-" + s, UtilityType.WATER, BillingMode.POSTPAID);
        captureReading(meterId, new BigDecimal("250.000"), YearMonth.now());

        BillGenerateRequest req = new BillGenerateRequest();
        req.setMeterId(meterId);
        req.setBillingMonth(YearMonth.now());

        String body = mockMvc.perform(post("/api/v1/bills/generate")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(body).get("id").asText();
    }

    private BigDecimal getBillBalance(String billId) {
        return billRepository.findById(UUID.fromString(billId)).orElseThrow().getBalance();
    }

    private UUID createCustomer(String nationalId) throws Exception {
        CustomerCreateRequest req = new CustomerCreateRequest();
        req.setFullName("Ingabire Rose");
        req.setNationalId(nationalId);
        req.setEmail("rose" + System.nanoTime() + "@example.com");
        req.setPhoneNumber("+250788000006");
        req.setAddress("KN 30 Ave, Kigali");
        req.setDistrict("Nyarugenge");

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
        req.setInstallationAddress("KG 3 Ave, Kigali");

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
