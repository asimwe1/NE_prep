package com.template.repository;

import com.template.entity.BillingMode;
import com.template.entity.Tariff;
import com.template.entity.UtilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TariffRepository extends JpaRepository<Tariff, UUID> {

    boolean existsByTariffCode(String tariffCode);

    Optional<Tariff> findByTariffCode(String tariffCode);

    Optional<Tariff> findTopByUtilityTypeAndBillingModeAndActiveTrueOrderByVersionDesc(
            UtilityType utilityType, BillingMode billingMode);

    /**
     * Finds tariffs where the given billingMonth falls within the effective period.
     * billingMonth is passed as a "YYYY-MM" string for lexicographic comparison.
     */
    @Query("SELECT t FROM Tariff t WHERE t.utilityType = :utilityType " +
           "AND t.billingMode = :billingMode AND t.active = true " +
           "AND t.effectiveStartCycle <= :billingMonth " +
           "AND (t.effectiveEndCycle IS NULL OR t.effectiveEndCycle >= :billingMonth) " +
           "ORDER BY t.version DESC")
    List<Tariff> findActiveTariffsForBillingMonth(
            @Param("utilityType") UtilityType utilityType,
            @Param("billingMode") BillingMode billingMode,
            @Param("billingMonth") String billingMonth);
}
