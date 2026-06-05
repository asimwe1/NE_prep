package com.template.repository;

import com.template.entity.Bill;
import com.template.entity.BillStatus;
import com.template.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BillRepository extends JpaRepository<Bill, UUID> {
    Optional<Bill> findByBillNumber(String billNumber);
    List<Bill> findByCustomerOrderByBillingMonthDesc(Customer customer);
    List<Bill> findByStatus(BillStatus status);
    List<Bill> findByDueDateBeforeAndStatus(LocalDate dueDate, BillStatus status);
    boolean existsByBillNumber(String billNumber);
}
