package com.template.service;

import com.template.dto.BillGenerateRequest;
import com.template.dto.BillResponse;
import com.template.entity.*;
import com.template.exception.ResourceNotFoundException;
import com.template.repository.BillRepository;
import com.template.repository.PenaltyConfigurationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;
    private final MeterService meterService;
    private final CustomerService customerService;
    private final MeterReadingService meterReadingService;
    private final TariffService tariffService;
    private final PenaltyConfigurationRepository penaltyConfigurationRepository;
    private final NotificationService notificationService;

    /**
     * Generates a bill for a meter in a given billing month.
     *
     * Steps:
     * 1. Load meter and customer; assert customer is ACTIVE.
     * 2. Load the meter reading for the billing month.
     * 3. Resolve the active tariff.
     * 4. Calculate amount (consumption-based + fixed service charge + VAT + optional penalty).
     * 5. Persist and send notification.
     */
    @Transactional
    public BillResponse generateBill(BillGenerateRequest request) {
        YearMonth billingYearMonth = request.getBillingMonth();
        if (billingYearMonth.isAfter(YearMonth.now())) {
            throw new IllegalArgumentException("Billing month must not be in the future");
        }

        UtilityMeter meter = meterService.findOrThrow(request.getMeterId());
        Customer customer = meter.getCustomer();
        customerService.validateCustomerIsActive(customer);

        LocalDate billingMonthDate = billingYearMonth.atDay(1);
        MeterReading reading = meterReadingService.findByMeterAndBillingMonth(meter, billingMonthDate);

        Tariff tariff = tariffService.getActiveTariff(
                meter.getUtilityType(), meter.getBillingMode(), billingYearMonth);

        BigDecimal consumption = reading.getConsumption();

        // Calculate consumption-based charge
        BigDecimal consumptionCharge;
        BigDecimal effectiveUnitPrice;

        if (tariff.getTariffType() == TariffType.FLAT) {
            // For FLAT: use first tier's unit price × consumption
            List<TariffTier> tiers = tariff.getTiers();
            if (tiers == null || tiers.isEmpty()) {
                throw new IllegalStateException(
                        "Flat tariff '" + tariff.getTariffCode() + "' has no pricing tiers configured");
            }
            effectiveUnitPrice = tiers.get(0).getUnitPrice();
            consumptionCharge = consumption.multiply(effectiveUnitPrice);
        } else {
            // TIER_BASED: apply tiered pricing slices
            List<TariffTier> tiers = tariff.getTiers().stream()
                    .sorted(Comparator.comparing(TariffTier::getTierMin))
                    .toList();
            consumptionCharge = calculateTieredCharge(consumption, tiers);
            effectiveUnitPrice = BigDecimal.ZERO; // no single unit price for tiered billing
        }

        BigDecimal baseAmount = consumptionCharge.add(tariff.getFixedServiceCharge());
        BigDecimal vatAmount = baseAmount.multiply(tariff.getVatRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = baseAmount.add(vatAmount);

        // Apply penalty if the billing month end date + grace period has already passed
        totalAmount = applyPenaltyIfLate(totalAmount, meter.getUtilityType(), billingYearMonth);

        LocalDate dueDate = LocalDate.now().plusDays(30);

        Bill bill = Bill.builder()
                .billNumber(generateBillNumber(billingYearMonth))
                .customer(customer)
                .meter(meter)
                .reading(reading)
                .billingMonth(billingMonthDate)
                .consumption(consumption.setScale(2, RoundingMode.HALF_UP))
                .unitPrice(effectiveUnitPrice.setScale(2, RoundingMode.HALF_UP))
                .amount(totalAmount.setScale(2, RoundingMode.HALF_UP))
                .paidAmount(BigDecimal.ZERO)
                .balance(totalAmount.setScale(2, RoundingMode.HALF_UP))
                .status(BillStatus.PENDING)
                .dueDate(dueDate)
                .build();

        Bill saved = billRepository.save(bill);
        notificationService.notifyBillGenerated(saved);
        return toResponse(saved);
    }

    public Page<BillResponse> listBills(Pageable pageable) {
        return billRepository.findAll(pageable).map(this::toResponse);
    }

    public BillResponse getBillById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public Page<BillResponse> getBillsByCustomer(UUID customerId, Pageable pageable) {
        Customer customer = customerService.findOrThrow(customerId);
        return billRepository.findByCustomerOrderByBillingMonthDesc(customer, pageable)
                .map(this::toResponse);
    }

    // ─── Internal helpers ────────────────────────────────────────────────────

    public Bill findOrThrow(UUID id) {
        return billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill", id));
    }

    /**
     * Applies tiered pricing: for each tier, compute the charge on the consumption
     * slice that falls within [tierMin, tierMax].
     */
    private BigDecimal calculateTieredCharge(BigDecimal consumption, List<TariffTier> tiers) {
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal remaining = consumption;

        for (TariffTier tier : tiers) {
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }
            BigDecimal tierWidth = tier.getTierMax().subtract(tier.getTierMin());
            BigDecimal slice = remaining.min(tierWidth);
            total = total.add(slice.multiply(tier.getUnitPrice()));
            remaining = remaining.subtract(slice);
        }

        // Any consumption beyond the last tier uses the last tier's unit price
        if (remaining.compareTo(BigDecimal.ZERO) > 0 && !tiers.isEmpty()) {
            TariffTier lastTier = tiers.get(tiers.size() - 1);
            total = total.add(remaining.multiply(lastTier.getUnitPrice()));
        }

        return total;
    }

    private BigDecimal applyPenaltyIfLate(BigDecimal amount, UtilityType utilityType, YearMonth billingMonth) {
        return penaltyConfigurationRepository
                .findTopByUtilityTypeAndActiveTrueOrderByCreatedAtDesc(utilityType)
                .map(penalty -> {
                    // Penalty applies if billingMonth end + gracePeriod < today
                    LocalDate graceCutoff = billingMonth.atEndOfMonth()
                            .plusDays(penalty.getGracePeriodDays());
                    if (graceCutoff.isBefore(LocalDate.now())) {
                        BigDecimal penaltyAmount = amount.multiply(penalty.getRate())
                                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                        return amount.add(penaltyAmount);
                    }
                    return amount;
                })
                .orElse(amount);
    }

    private String generateBillNumber(YearMonth billingMonth) {
        String prefix = "BILL-" + billingMonth.toString().replace("-", "") + "-";
        String candidate;
        do {
            candidate = prefix + String.format("%06d", (long) (Math.random() * 1_000_000));
        } while (billRepository.existsByBillNumber(candidate));
        return candidate;
    }

    BillResponse toResponse(Bill b) {
        return BillResponse.builder()
                .id(b.getId())
                .billNumber(b.getBillNumber())
                .customerId(b.getCustomer().getId())
                .customerName(b.getCustomer().getFullName())
                .customerNumber(b.getCustomer().getCustomerNumber())
                .meterId(b.getMeter().getId())
                .meterNumber(b.getMeter().getMeterNumber())
                .billingMonth(YearMonth.from(b.getBillingMonth()).toString())
                .consumption(b.getConsumption())
                .unitPrice(b.getUnitPrice())
                .amount(b.getAmount())
                .paidAmount(b.getPaidAmount())
                .balance(b.getBalance())
                .status(b.getStatus())
                .dueDate(b.getDueDate())
                .createdAt(b.getCreatedAt())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
