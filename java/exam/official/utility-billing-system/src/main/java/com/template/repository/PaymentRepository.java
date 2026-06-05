package com.template.repository;

import com.template.entity.Bill;
import com.template.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByPaymentReference(String paymentReference);
    List<Payment> findByBill(Bill bill);
    boolean existsByPaymentReference(String paymentReference);
}
