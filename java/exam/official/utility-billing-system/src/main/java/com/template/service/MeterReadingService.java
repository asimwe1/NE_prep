package com.template.service;

import com.template.dto.MeterReadingRequest;
import com.template.dto.MeterReadingResponse;
import com.template.entity.MeterReading;
import com.template.entity.MeterStatus;
import com.template.entity.UtilityMeter;
import com.template.exception.DuplicateReadingException;
import com.template.exception.InactiveMeterException;
import com.template.exception.InvalidReadingException;
import com.template.exception.ResourceNotFoundException;
import com.template.repository.MeterReadingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeterReadingService {

    private final MeterReadingRepository readingRepository;
    private final MeterService meterService;

    /**
     * Captures a new meter reading after enforcing:
     * 1. Meter must be ACTIVE.
     * 2. No existing reading for the same meter + billing month.
     * 3. currentReading must be strictly greater than the previous reading.
     * 4. billingMonth must not be a future month.
     */
    @Transactional
    public MeterReadingResponse captureReading(MeterReadingRequest request) {
        UtilityMeter meter = meterService.findOrThrow(request.getMeterId());

        if (meter.getStatus() != MeterStatus.ACTIVE) {
            throw new InactiveMeterException(meter.getMeterNumber());
        }

        YearMonth billingYearMonth = request.getBillingMonth();
        if (billingYearMonth.isAfter(YearMonth.now())) {
            throw new IllegalArgumentException("Billing month must not be a future month");
        }

        LocalDate billingMonthDate = billingYearMonth.atDay(1);

        if (readingRepository.existsByMeterAndBillingMonth(meter, billingMonthDate)) {
            throw new DuplicateReadingException(meter.getMeterNumber(), billingYearMonth.toString());
        }

        BigDecimal previousReadingValue = readingRepository
                .findTopByMeterOrderByBillingMonthDesc(meter)
                .map(MeterReading::getCurrentReading)
                .orElse(BigDecimal.ZERO);

        if (request.getCurrentReading().compareTo(previousReadingValue) <= 0) {
            throw new InvalidReadingException(request.getCurrentReading(), previousReadingValue);
        }

        BigDecimal consumption = request.getCurrentReading().subtract(previousReadingValue);

        MeterReading reading = MeterReading.builder()
                .meter(meter)
                .billingMonth(billingMonthDate)
                .readingDate(request.getReadingDate())
                .previousReading(previousReadingValue)
                .currentReading(request.getCurrentReading())
                .consumption(consumption)
                .build();

        return toResponse(readingRepository.save(reading));
    }

    public Page<MeterReadingResponse> listReadings(Pageable pageable) {
        return readingRepository.findAll(pageable).map(this::toResponse);
    }

    public Page<MeterReadingResponse> getReadingsByMeter(UUID meterId, Pageable pageable) {
        UtilityMeter meter = meterService.findOrThrow(meterId);
        return readingRepository.findByMeter(meter, pageable).map(this::toResponse);
    }

    public MeterReadingResponse getById(UUID id) {
        return readingRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("MeterReading", id));
    }

    // ─── Internal helpers ────────────────────────────────────────────────────

    /** Package-accessible so BillService can look up readings by meter + month. */
    public MeterReading findByMeterAndBillingMonth(UtilityMeter meter, LocalDate billingMonth) {
        return readingRepository.findByMeterAndBillingMonth(meter, billingMonth)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No reading found for meter '" + meter.getMeterNumber() + "' in billing month " + billingMonth));
    }

    private MeterReadingResponse toResponse(MeterReading r) {
        return MeterReadingResponse.builder()
                .id(r.getId())
                .meterId(r.getMeter().getId())
                .meterNumber(r.getMeter().getMeterNumber())
                .billingMonth(YearMonth.from(r.getBillingMonth()).toString())
                .readingDate(r.getReadingDate())
                .previousReading(r.getPreviousReading())
                .currentReading(r.getCurrentReading())
                .consumption(r.getConsumption())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
