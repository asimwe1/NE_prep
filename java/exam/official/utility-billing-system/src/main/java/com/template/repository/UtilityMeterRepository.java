package com.template.repository;

import com.template.entity.Customer;
import com.template.entity.UtilityMeter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UtilityMeterRepository extends JpaRepository<UtilityMeter, UUID> {
    Optional<UtilityMeter> findByMeterNumber(String meterNumber);
    List<UtilityMeter> findByCustomer(Customer customer);
    boolean existsByMeterNumber(String meterNumber);
}
