package com.template.dto;

import com.template.entity.BillingMode;
import com.template.entity.TariffType;
import com.template.entity.UtilityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TariffResponse {
    private UUID id;
    private String tariffCode;
    private UtilityType utilityType;
    private BillingMode billingMode;
    private TariffType tariffType;
    private Integer version;
    private String effectiveStartCycle;
    private String effectiveEndCycle;
    private BigDecimal fixedServiceCharge;
    private BigDecimal vatRate;
    private boolean active;
    private List<TariffTierResponse> tiers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
