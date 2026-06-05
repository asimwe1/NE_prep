package com.template.repository;

import com.template.entity.Bill;
import com.template.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByPaymentReference(String paymentReference);
    List<Payment> findByBill(Bill bill);
    Page<Payment> findByBill(Bill bill, Pageable pageable);
    boolean existsByPaymentReference(String paymentReference);
}
