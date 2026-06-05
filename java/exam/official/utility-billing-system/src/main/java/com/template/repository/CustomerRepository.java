package com.template.repository;

import com.template.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByCustomerNumber(String customerNumber);
    Optional<Customer> findByNationalId(String nationalId);
    Optional<Customer> findByUserId(UUID userId);
    boolean existsByCustomerNumber(String customerNumber);
    boolean existsByNationalId(String nationalId);
    boolean existsByUserId(UUID userId);
}
