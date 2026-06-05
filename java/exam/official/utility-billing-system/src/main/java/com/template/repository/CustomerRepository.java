package com.template.repository;

import com.template.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByCustomerNumber(String customerNumber);
    Optional<Customer> findByNationalId(String nationalId);
    boolean existsByCustomerNumber(String customerNumber);
    boolean existsByNationalId(String nationalId);
}
