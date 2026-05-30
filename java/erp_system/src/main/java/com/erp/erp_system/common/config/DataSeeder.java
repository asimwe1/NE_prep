package com.erp.erp_system.common.config;

import com.erp.erp_system.modules.deductions.entity.DeductionConfig;
import com.erp.erp_system.modules.deductions.repository.DeductionConfigRepository;
import com.erp.erp_system.modules.payroll.service.DeductionCodes;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private final DeductionConfigRepository deductionRepository;

    /** Seeds required deduction rates when they do not already exist. */
    @Override
    public void run(String... args) {
        seed(DeductionCodes.EMPLOYEE_TAX, "Employee Tax", "30.00");
        seed(DeductionCodes.PENSION, "Pension", "6.00");
        seed(DeductionCodes.MEDICAL_INSURANCE, "Medical Insurance", "5.00");
        seed(DeductionCodes.CASH_ADVANCE, "Cash Advance", "5.00");
        seed(DeductionCodes.SINKING_FUND, "Sinking Fund", "1.00");
        seed(DeductionCodes.TRANSPORT, "Transport", "1.00");
    }

    private void seed(String code, String name, String percentage) {
        if (deductionRepository.existsByCode(code)) return;
        DeductionConfig config = new DeductionConfig();
        config.setCode(code);
        config.setName(name);
        config.setPercentage(new BigDecimal(percentage));
        config.setActive(true);
        deductionRepository.save(config);
    }
}
