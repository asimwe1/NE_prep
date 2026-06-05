package com.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.template.dto.*;
import com.template.entity.BillingMode;
import com.template.entity.BillStatus;
import com.template.entity.CompanyType;
import com.template.entity.TariffType;
import com.template.entity.UtilityType;
import com.template.repository.BillRepository;
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
class PaymentIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired BillRepository billRepository;

    @Value("${app.admin.default-password}")
    String adminPassword;

    private String adminToken;
    private static final AtomicLong NID_SEQ   = new AtomicLong(1199880500000100L);
    private static final AtomicLong METER_SEQ = new AtomicLong(3000L);

    @BeforeEach
    void setUp() throws Exception {
        adminToken = loginAsAdmin();
    }

    // ─── Full payment ─────────────────────────────────────────────────────────

    @Test
    void fullPayment_setsBillStatusToPaid() throws Exception {
        String billId = createBillForTest("1199880500000001", "MTR-PAY-A001", "PAY-TARIFF-A01");

        BigDecimal billAmount = getBillBalance(billId);

        PaymentRequest req = paymentRequest(UUID.fromString(billId), billAmount, "PAY-REF-FULL-001");

        String payBody = mockMvc.perform(post("/api/v1/payments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.billStatus").value("PAID"))
                .andExpect(jsonPath("$.billBalance").value(0))
                .andReturn().getResponse().getContentAsString();

        // Verify DB state
        UUID billUuid = UUID.fromString(billId);
        assertThat(billRepository.findById(billUuid).orElseThrow().getStatus())
                .isEqualTo(BillStatus.PAID);
    }

    @Test
    void partialPayment_setsBillStatusToPartiallyPaid() throws Exception {
        String billId = createBillForTest("1199880500000002", "MTR-PAY-B001", "PAY-TARIFF-B01");
        BigDecimal billAmount = getBillBalance(billId);
        BigDecimal partial = billAmount.divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);

        PaymentRequest req = paymentRequest(UUID.fromString(billId), partial, "PAY-REF-PART-001");

        mockMvc.perform(post("/api/v1/payments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.billStatus").value("PARTIALLY_PAID"));

        assertThat(billRepository.findById(UUID.fromString(billId)).orElseThrow().getStatus())
                .isEqualTo(BillStatus.PARTIALLY_PAID);
    }

    @Test
    void overpayment_returns400() throws Exception {
        String billId = createBillForTest("1199880500000003", "MTR-PAY-C001", "PAY-TARIFF-C01");
        BigDecimal billAmount = getBillBalance(billId);
        BigDecimal overpayment = billAmount.add(new BigDecimal("1000.00"));

        PaymentRequest req = paymentRequest(UUID.fromString(billId), overpayment, "PAY-REF-OVER-001");

        mockMvc.perform(post("/api/v1/payments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void payAlreadyPaidBill_returns400() throws Exception {
        String billId = createBillForTest("1199880500000004", "MTR-PAY-D001", "PAY-TARIFF-D01");
        BigDecimal billAmount = getBillBalance(billId);

        // Pay in full
        mockMvc.perform(post("/api/v1/payments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        paymentRequest(UUID.fromString(billId), billAmount, "PAY-REF-PAID-001"))))
                .andExpect(status().isCreated());

        // Try to pay again
        mockMvc.perform(post("/api/v1/payments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        paymentRequest(UUID.fromString(billId), new BigDecimal("100.00"), "PAY-REF-PAID-002"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void payment_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/payments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        paymentRequest(UUID.randomUUID(), new BigDecimal("100.00"), "PAY-NOAUTH-001"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void payment_invalidAmount_zero_returns400() throws Exception {
        PaymentRequest req = paymentRequest(UUID.randomUUID(), BigDecimal.ZERO, "PAY-ZERO-001");

        mockMvc.perform(post("/api/v1/payments")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private PaymentRequest paymentRequest(UUID billId, BigDecimal amount, String reference) {
        PaymentRequest req = new PaymentRequest();
        req.setBillId(billId);
        req.setAmount(amount);
        req.setPaymentMethod("Bank Transfer");
        req.setPaymentReference(reference);
        return req;
    }

    private BigDecimal getBillBalance(String billId) {
        return billRepository.findById(UUID.fromString(billId)).orElseThrow().getBalance();
    }

    /**
     * Creates a full billing chain: customer → meter → tariff → reading → bill.
     * Returns the generated bill ID.
     */
    private String createBillForTest(String nationalId, String meterNumber, String tariffCode) throws Exception {
        UUID customerId = createCustomer(String.valueOf(NID_SEQ.getAndIncrement()));
        UUID meterId = createMeter("MTR-PAY-" + METER_SEQ.getAndIncrement(), customerId);
        createTariff("PAY-TARIFF-" + METER_SEQ.get(), UtilityType.WATER, BillingMode.POSTPAID);
        YearMonth billingMonth = YearMonth.now();
        captureReading(meterId, new BigDecimal("500.000"), billingMonth);

        BillGenerateRequest req = new BillGenerateRequest();
        req.setMeterId(meterId);
        req.setBillingMonth(billingMonth);

        String body = mockMvc.perform(post("/api/v1/bills/generate")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(body).get("id").asText();
    }

    private UUID createCustomer(String nationalId) throws Exception {
        CustomerRequest req = new CustomerRequest();
        req.setFullName("Uwimana Grace");
        req.setNationalId(nationalId);
        req.setEmail("grace" + System.nanoTime() + "@example.com");
        req.setPhoneNumber("+250788000005");
        req.setAddress("KG 88 St, Kigali");
        req.setDistrict("Gasabo");

        String body = mockMvc.perform(post("/api/v1/customers")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();

        return UUID.fromString(objectMapper.readTree(body).get("id").asText());
    }

    private UUID createMeter(String meterNumber, UUID customerId) throws Exception {
        MeterRequest req = new MeterRequest();
        req.setMeterNumber(meterNumber);
        req.setUtilityType(UtilityType.WATER);
        req.setBillingMode(BillingMode.POSTPAID);
        req.setCompanyType(CompanyType.WASAC);
        req.setCustomerId(customerId);
        req.setInstallationDate(LocalDate.now());
        req.setInstallationAddress("KG 2 Ave, Kigali");

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
