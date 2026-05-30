package com.erp.erp_system.modules.deductions.dto;

import java.math.BigDecimal;

public record DeductionResponse(Long id, String code, String name, BigDecimal percentage, boolean active) {
}
