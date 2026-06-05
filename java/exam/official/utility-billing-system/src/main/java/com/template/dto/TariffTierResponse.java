package com.template.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TariffTierResponse {
    private UUID id;
    private BigDecimal tierMin;
    private BigDecimal tierMax;
    private BigDecimal unitPrice;
}
