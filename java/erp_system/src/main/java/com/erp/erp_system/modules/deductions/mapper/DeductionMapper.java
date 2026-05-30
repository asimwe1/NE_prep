package com.erp.erp_system.modules.deductions.mapper;

import com.erp.erp_system.modules.deductions.dto.*;
import com.erp.erp_system.modules.deductions.entity.DeductionConfig;

public class DeductionMapper {
    private DeductionMapper() {
    }

    /** Maps a request to a deduction configuration entity. */
    public static DeductionConfig fromRequest(DeductionRequest request) {
        DeductionConfig config = new DeductionConfig();
        update(config, request);
        return config;
    }

    /** Applies request values to a deduction configuration entity. */
    public static void update(DeductionConfig config, DeductionRequest request) {
        config.setCode(request.code());
        config.setName(request.name());
        config.setPercentage(request.percentage());
        config.setActive(request.active());
    }

    /** Maps a deduction configuration entity to a response. */
    public static DeductionResponse toResponse(DeductionConfig config) {
        return new DeductionResponse(config.getId(), config.getCode(), config.getName(),
                config.getPercentage(), config.isActive());
    }
}
