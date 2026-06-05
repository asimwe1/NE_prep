package com.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.template.dto.LoginRequest;
import com.template.dto.TariffRequest;
import com.template.dto.TariffTierRequest;
import com.template.entity.BillingMode;
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
import java.time.YearMonth;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TariffIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Value("${app.admin.default-password}")
    String adminPassword;

    private String adminToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = loginAsAdmin();
    }

    // ─── Create flat tariff ───────────────────────────────────────────────────

    @Test
    void createFlatTariff_asAdmin_returns201() throws Exception {
        TariffRequest req = flatTariffRequest("WATER-FLAT-T01", UtilityType.WATER, BillingMode.POSTPAID);

        mockMvc.perform(post("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tariffCode").value("WATER-FLAT-T01"))
                .andExpect(jsonPath("$.active").value(true));
    }

    @Test
    void createTariff_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/tariffs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        flatTariffRequest("WATER-NOAUTH-T01", UtilityType.WATER, BillingMode.POSTPAID))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createTariff_duplicateCode_returns400() throws Exception {
        TariffRequest req = flatTariffRequest("ELEC-DUP-T01", UtilityType.ELECTRICITY, BillingMode.PREPAID);

        mockMvc.perform(post("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createTariff_pastStartCycle_returns400() throws Exception {
        TariffRequest req = flatTariffRequest("WATER-PAST-T01", UtilityType.WATER, BillingMode.POSTPAID);
        req.setEffectiveStartCycle(YearMonth.now().minusMonths(2));

        mockMvc.perform(post("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ─── Tiered tariff ────────────────────────────────────────────────────────

    @Test
    void createTieredTariff_withValidTiers_returns201() throws Exception {
        TariffRequest req = tieredTariffRequest("WATER-TIER-T01", UtilityType.WATER, BillingMode.POSTPAID);

        mockMvc.perform(post("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tariffType").value("TIER_BASED"))
                .andExpect(jsonPath("$.tiers").isArray());
    }

    @Test
    void createTieredTariff_noTiers_returns400() throws Exception {
        TariffRequest req = flatTariffRequest("WATER-NOTIERS-T01", UtilityType.WATER, BillingMode.POSTPAID);
        req.setTariffType(TariffType.TIER_BASED);
        req.setTiers(null);

        mockMvc.perform(post("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ─── Versioning ───────────────────────────────────────────────────────────

    @Test
    void createNewTariffVersion_deactivatesOldOne() throws Exception {
        TariffRequest v1 = flatTariffRequest("WATER-VER-V1", UtilityType.WATER, BillingMode.POSTPAID);
        v1.setVersion(1);

        String v1Body = mockMvc.perform(post("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(v1)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String v1Id = objectMapper.readTree(v1Body).get("id").asText();

        // Create V2 — should deactivate V1
        TariffRequest v2 = flatTariffRequest("WATER-VER-V2", UtilityType.WATER, BillingMode.POSTPAID);
        v2.setVersion(2);
        mockMvc.perform(post("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(v2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.active").value(true));

        // V1 must now be inactive
        mockMvc.perform(get("/api/v1/tariffs/" + v1Id)
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
    }

    // ─── List tariffs ─────────────────────────────────────────────────────────

    @Test
    void listTariffs_asAdmin_returnsPage() throws Exception {
        mockMvc.perform(get("/api/v1/tariffs")
                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private TariffRequest flatTariffRequest(String code, UtilityType type, BillingMode mode) {
        TariffTierRequest tier = new TariffTierRequest();
        tier.setTierMin(BigDecimal.ZERO);
        tier.setTierMax(new BigDecimal("9999"));
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
        return req;
    }

    private TariffRequest tieredTariffRequest(String code, UtilityType type, BillingMode mode) {
        TariffTierRequest tier1 = new TariffTierRequest();
        tier1.setTierMin(BigDecimal.ZERO);
        tier1.setTierMax(new BigDecimal("10"));
        tier1.setUnitPrice(new BigDecimal("100.00"));

        TariffTierRequest tier2 = new TariffTierRequest();
        tier2.setTierMin(new BigDecimal("10"));
        tier2.setTierMax(new BigDecimal("50"));
        tier2.setUnitPrice(new BigDecimal("200.00"));

        TariffRequest req = new TariffRequest();
        req.setTariffCode(code);
        req.setUtilityType(type);
        req.setBillingMode(mode);
        req.setTariffType(TariffType.TIER_BASED);
        req.setVersion(1);
        req.setEffectiveStartCycle(YearMonth.now());
        req.setFixedServiceCharge(new BigDecimal("500.00"));
        req.setVatRate(new BigDecimal("18.00"));
        req.setTiers(List.of(tier1, tier2));
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
