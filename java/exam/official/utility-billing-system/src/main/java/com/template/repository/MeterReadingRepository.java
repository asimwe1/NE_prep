package com.template.repository;

import com.template.entity.MeterReading;
import com.template.entity.UtilityMeter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MeterReadingRepository extends JpaRepository<MeterReading, UUID> {
    Optional<MeterReading> findByMeterAndBillingMonth(UtilityMeter meter, LocalDate billingMonth);
    List<MeterReading> findByMeterOrderByBillingMonthDesc(UtilityMeter meter);
    Optional<MeterReading> findTopByMeterOrderByBillingMonthDesc(UtilityMeter meter);
    boolean existsByMeterAndBillingMonth(UtilityMeter meter, LocalDate billingMonth);
    Page<MeterReading> findAll(Pageable pageable);
    Page<MeterReading> findByMeter(UtilityMeter meter, Pageable pageable);
}
