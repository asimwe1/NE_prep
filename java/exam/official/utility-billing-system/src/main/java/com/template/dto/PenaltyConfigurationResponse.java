package com.template.dto;

import com.template.entity.UtilityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PenaltyConfigurationResponse {
    private UUID id;
    private String name;
    private BigDecimal rate;
    private Integer gracePeriodDays;
    private UtilityType utilityType;
    private boolean active;
    private LocalDateTime createdAt;
}
