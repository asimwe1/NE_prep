package com.erp.erp_system.modules.deductions.repository;

import com.erp.erp_system.modules.deductions.entity.DeductionConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DeductionConfigRepository extends JpaRepository<DeductionConfig, Long> {
    boolean existsByCode(String code);

    boolean existsByName(String name);

    Optional<DeductionConfig> findByCodeAndActiveTrue(String code);
}
