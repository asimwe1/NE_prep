package com.template.repository;

import com.template.entity.PenaltyConfiguration;
import com.template.entity.UtilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PenaltyConfigurationRepository extends JpaRepository<PenaltyConfiguration, UUID> {

    Optional<PenaltyConfiguration> findTopByUtilityTypeAndActiveTrueOrderByCreatedAtDesc(
            UtilityType utilityType);
}
