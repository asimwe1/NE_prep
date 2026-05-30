package com.erp.erp_system.modules.payroll.repository;

import com.erp.erp_system.modules.payroll.entity.Payroll;
import com.erp.erp_system.modules.payroll.entity.PayrollStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    boolean existsByEmployeeIdAndMonthAndYear(Long employeeId, int month, int year);

    @EntityGraph(attributePaths = {"employee", "employment"})
    List<Payroll> findByMonthAndYear(int month, int year);

    @EntityGraph(attributePaths = {"employee", "employment"})
    List<Payroll> findByEmployeeId(Long employeeId);

    @EntityGraph(attributePaths = {"employee", "employment"})
    List<Payroll> findByEmployeeIdAndStatus(Long employeeId, PayrollStatus status);

    @EntityGraph(attributePaths = {"employee", "employment"})
    List<Payroll> findByStatus(PayrollStatus status);

    @EntityGraph(attributePaths = {"employee", "employment"})
    Optional<Payroll> findWithDetailsById(Long id);
}
