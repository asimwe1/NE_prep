package com.template.service;

import com.template.dto.*;
import com.template.entity.*;
import com.template.exception.ResourceNotFoundException;
import com.template.exception.TariffNotFoundException;
import com.template.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TariffService {

    private final TariffRepository tariffRepository;
    private final TariffTierRepository tariffTierRepository;
    private final TaxConfigurationRepository taxConfigurationRepository;
    private final PenaltyConfigurationRepository penaltyConfigurationRepository;

    /**
     * Creates the next tariff version and deactivates the currently active tariff
     * for the same utility type and billing mode. Existing bills keep their stored amounts.
     */
    /**
     * Creates a new tariff version. Enforces the following rules:
     * <ol>
     *   <li>Tariff code must be unique.</li>
     *   <li>Effective start cycle must be the current month or a future month.</li>
     *   <li>Tier-based tariffs must include at least one tier, and each tier's max must exceed its min.</li>
     *   <li>The existing active tariff for the same utility type + billing mode is automatically deactivated,
     *       implementing an implicit versioning strategy.</li>
     * </ol>
     *
     * @param request validated tariff creation payload
     * @return the persisted tariff as a response DTO
     */
    @Transactional
    public TariffResponse createTariff(TariffRequest request) {
        if (tariffRepository.existsByTariffCode(request.getTariffCode())) {
            throw new IllegalArgumentException("Tariff code '" + request.getTariffCode() + "' already exists");
        }

        YearMonth startCycle = request.getEffectiveStartCycle();
        YearMonth currentMonth = YearMonth.now();
        if (startCycle.isBefore(currentMonth)) {
            throw new IllegalArgumentException(
                    "Effective start cycle must be the current month or a future month");
        }

        if (request.getTariffType() == TariffType.TIER_BASED
                && (request.getTiers() == null || request.getTiers().isEmpty())) {
            throw new IllegalArgumentException("Tier-based tariffs must include at least one tier");
        }

        if (request.getTiers() != null) {
            for (TariffTierRequest tier : request.getTiers()) {
                if (tier.getTierMax().compareTo(tier.getTierMin()) <= 0) {
                    throw new IllegalArgumentException(
                            "Tier maximum must be greater than tier minimum");
                }
            }
        }

        tariffRepository
                .findTopByUtilityTypeAndBillingModeAndActiveTrueOrderByVersionDesc(
                        request.getUtilityType(), request.getBillingMode())
                .ifPresent(existing -> {
                    existing.setActive(false);
                    tariffRepository.save(existing);
                });

        Tariff tariff = Tariff.builder()
                .tariffCode(request.getTariffCode().trim().toUpperCase())
                .utilityType(request.getUtilityType())
                .billingMode(request.getBillingMode())
                .tariffType(request.getTariffType())
                .version(request.getVersion())
                .effectiveStartCycle(startCycle.toString())
                .effectiveEndCycle(request.getEffectiveEndCycle() != null
                        ? request.getEffectiveEndCycle().toString() : null)
                .fixedServiceCharge(request.getFixedServiceCharge())
                .vatRate(request.getVatRate())
                .build();

        Tariff saved = tariffRepository.save(tariff);

        if (request.getTiers() != null) {
            List<TariffTier> tiers = request.getTiers().stream()
                    .map(t -> TariffTier.builder()
                            .tariff(saved)
                            .tierMin(t.getTierMin())
                            .tierMax(t.getTierMax())
                            .unitPrice(t.getUnitPrice())
                            .build())
                    .collect(Collectors.toList());
            tariffTierRepository.saveAll(tiers);
            saved.setTiers(tiers);
        }

        return toResponse(saved);
    }

    @Transactional
    public TariffResponse deactivateTariff(UUID id) {
        Tariff tariff = findOrThrow(id);
        tariff.setActive(false);
        return toResponse(tariffRepository.save(tariff));
    }

    public Page<TariffResponse> listTariffs(Pageable pageable) {
        return tariffRepository.findAll(pageable).map(this::toResponse);
    }

    public TariffResponse getTariffById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    /**
     * Resolves the active tariff for the given utility type, billing mode, and billing month.
     * Used by BillService during bill generation.
     */
    public Tariff getActiveTariff(UtilityType utilityType, BillingMode billingMode, YearMonth billingMonth) {
        List<Tariff> matches = tariffRepository.findActiveTariffsForBillingMonth(
                utilityType, billingMode, billingMonth.toString());
        if (matches.isEmpty()) {
            throw new TariffNotFoundException(
                    "No active tariff found for utility type '" + utilityType
                    + "', billing mode '" + billingMode
                    + "', billing month '" + billingMonth + "'");
        }
        return matches.get(0);
    }

    @Transactional
    public TaxConfigurationResponse createTaxConfig(TaxConfigurationRequest request) {
        TaxConfiguration config = TaxConfiguration.builder()
                .name(request.getName().trim())
                .rate(request.getRate())
                .utilityType(request.getUtilityType())
                .effectiveFrom(request.getEffectiveFrom().toString())
                .build();
        return toTaxResponse(taxConfigurationRepository.save(config));
    }

    @Transactional
    public TaxConfigurationResponse deactivateTaxConfig(UUID id) {
        TaxConfiguration config = taxConfigurationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TaxConfiguration", id));
        config.setActive(false);
        return toTaxResponse(taxConfigurationRepository.save(config));
    }

    public Page<TaxConfigurationResponse> listTaxConfigs(Pageable pageable) {
        return taxConfigurationRepository.findAll(pageable).map(this::toTaxResponse);
    }

    @Transactional
    public PenaltyConfigurationResponse createPenaltyConfig(PenaltyConfigurationRequest request) {
        PenaltyConfiguration config = PenaltyConfiguration.builder()
                .name(request.getName().trim())
                .rate(request.getRate())
                .gracePeriodDays(request.getGracePeriodDays())
                .utilityType(request.getUtilityType())
                .build();
        return toPenaltyResponse(penaltyConfigurationRepository.save(config));
    }

    @Transactional
    public PenaltyConfigurationResponse deactivatePenaltyConfig(UUID id) {
        PenaltyConfiguration config = penaltyConfigurationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PenaltyConfiguration", id));
        config.setActive(false);
        return toPenaltyResponse(penaltyConfigurationRepository.save(config));
    }

    public Page<PenaltyConfigurationResponse> listPenaltyConfigs(Pageable pageable) {
        return penaltyConfigurationRepository.findAll(pageable).map(this::toPenaltyResponse);
    }

    public Tariff findOrThrow(UUID id) {
        return tariffRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tariff", id));
    }

    private TariffResponse toResponse(Tariff t) {
        List<TariffTierResponse> tierResponses = t.getTiers().stream()
                .map(tier -> TariffTierResponse.builder()
                        .id(tier.getId())
                        .tierMin(tier.getTierMin())
                        .tierMax(tier.getTierMax())
                        .unitPrice(tier.getUnitPrice())
                        .build())
                .collect(Collectors.toList());

        return TariffResponse.builder()
                .id(t.getId())
                .tariffCode(t.getTariffCode())
                .utilityType(t.getUtilityType())
                .billingMode(t.getBillingMode())
                .tariffType(t.getTariffType())
                .version(t.getVersion())
                .effectiveStartCycle(t.getEffectiveStartCycle())
                .effectiveEndCycle(t.getEffectiveEndCycle())
                .fixedServiceCharge(t.getFixedServiceCharge())
                .vatRate(t.getVatRate())
                .active(t.isActive())
                .tiers(tierResponses)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }

    private TaxConfigurationResponse toTaxResponse(TaxConfiguration c) {
        return TaxConfigurationResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .rate(c.getRate())
                .utilityType(c.getUtilityType())
                .effectiveFrom(c.getEffectiveFrom())
                .active(c.isActive())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private PenaltyConfigurationResponse toPenaltyResponse(PenaltyConfiguration c) {
        return PenaltyConfigurationResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .rate(c.getRate())
                .gracePeriodDays(c.getGracePeriodDays())
                .utilityType(c.getUtilityType())
                .active(c.isActive())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
