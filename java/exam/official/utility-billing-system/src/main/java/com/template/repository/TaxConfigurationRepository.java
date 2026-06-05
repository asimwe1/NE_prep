package com.template.repository;

import com.template.entity.TaxConfiguration;
import com.template.entity.UtilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaxConfigurationRepository extends JpaRepository<TaxConfiguration, UUID> {

    List<TaxConfiguration> findByUtilityTypeAndActiveTrue(UtilityType utilityType);
}
