package com.erp.erp_system.modules.payroll.entity;

import com.erp.erp_system.modules.employees.entity.Employee;
import com.erp.erp_system.modules.employment.entity.Employment;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "payrolls", uniqueConstraints = @UniqueConstraint(
        name = "uk_payroll_employee_month_year", columnNames = {"employee_id", "payroll_month", "payroll_year"}))
public class Payroll {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "employment_id", nullable = false)
    private Employment employment;

    private BigDecimal baseSalary;
    private BigDecimal housingAmount;
    private BigDecimal transportAmount;
    private BigDecimal employeeTaxedAmount;
    private BigDecimal pensionAmount;
    private BigDecimal medicalInsuranceAmount;
    private BigDecimal otherTaxedAmount;
    private BigDecimal grossSalary;
    private BigDecimal netSalary;
    @Column(name = "payroll_month", nullable = false)
    private int month;

    @Column(name = "payroll_year", nullable = false)
    private int year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PayrollStatus status = PayrollStatus.PENDING;
}
