package com.erp.erp_system.modules.payroll.service;

import com.erp.erp_system.common.exception.*;
import com.erp.erp_system.modules.deductions.service.DeductionService;
import com.erp.erp_system.modules.employees.entity.Employee;
import com.erp.erp_system.modules.employees.service.EmployeeService;
import com.erp.erp_system.modules.employment.entity.*;
import com.erp.erp_system.modules.employment.repository.EmploymentRepository;
import com.erp.erp_system.modules.notifications.service.PayrollNotificationService;
import com.erp.erp_system.modules.payroll.dto.*;
import com.erp.erp_system.modules.payroll.entity.*;
import com.erp.erp_system.modules.payroll.mapper.PayrollMapper;
import com.erp.erp_system.modules.payroll.repository.PayrollRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PayrollService {
    private final EmploymentRepository employmentRepository;
    private final PayrollRepository payrollRepository;
    private final DeductionService deductionService;
    private final PayrollCalculator calculator;
    private final EmployeeService employeeService;
    private final PayrollNotificationService notificationService;

    /** Generates pending payroll records for active employment records. */
    @Transactional
    public List<PayrollResponse> generate(PayrollGenerateRequest request) {
        PayrollRates rates = rates();
        return employmentRepository.findByStatus(EmploymentStatus.ACTIVE).stream()
                .filter(this::employeeIsActive)
                .map(employment -> createPayroll(employment, request, rates))
                .map(PayrollMapper::toResponse)
                .toList();
    }

    /** Lists payroll records for a month and year. */
    public List<PayrollResponse> findByPeriod(int month, int year) {
        return payrollRepository.findByMonthAndYear(month, year).stream()
                .map(PayrollMapper::toResponse)
                .toList();
    }

    /** Lists pending salary payments. */
    public List<PayrollResponse> findPending() {
        return payrollRepository.findByStatus(PayrollStatus.PENDING).stream()
                .map(PayrollMapper::toResponse)
                .toList();
    }

    /** Lists pending salary payments for the authenticated employee. */
    public List<PayrollResponse> findOwnPending(String email) {
        Employee employee = employeeService.findEntityByEmail(email);
        return payrollRepository.findByEmployeeIdAndStatus(employee.getId(), PayrollStatus.PENDING).stream()
                .map(PayrollMapper::toResponse)
                .toList();
    }

    /** Lists payslips for the authenticated employee. */
    public List<PayrollResponse> findOwnPayslips(String email) {
        Employee employee = employeeService.findEntityByEmail(email);
        return payrollRepository.findByEmployeeId(employee.getId()).stream()
                .map(PayrollMapper::toResponse)
                .toList();
    }

    /** Approves one pending payroll and sends the employee notification email. */
    @Transactional
    public PayrollResponse approve(Long id) {
        Payroll payroll = payrollRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found"));
        if (payroll.getStatus() == PayrollStatus.PAID) throw new BusinessException("Payroll already paid");
        payroll.setStatus(PayrollStatus.PAID);
        notificationService.notifyPaid(payroll);
        return PayrollMapper.toResponse(payroll);
    }

    private Payroll createPayroll(Employment employment, PayrollGenerateRequest request, PayrollRates rates) {
        Long employeeId = employment.getEmployee().getId();
        if (payrollRepository.existsByEmployeeIdAndMonthAndYear(employeeId, request.month(), request.year())) {
            throw new DuplicateResourceException("Duplicate payroll for employee " + employment.getEmployee().getCode());
        }
        PayrollCalculation calculation = calculator.calculate(employment.getBaseSalary(), rates);
        Payroll payroll = fillPayroll(employment, request, calculation);
        return payrollRepository.save(payroll);
    }

    private Payroll fillPayroll(Employment employment, PayrollGenerateRequest request, PayrollCalculation calc) {
        Payroll payroll = new Payroll();
        payroll.setEmployee(employment.getEmployee());
        payroll.setEmployment(employment);
        payroll.setBaseSalary(employment.getBaseSalary());
        payroll.setHousingAmount(calc.housing());
        payroll.setTransportAmount(calc.transport());
        payroll.setGrossSalary(calc.gross());
        payroll.setEmployeeTaxedAmount(calc.employeeTax());
        payroll.setPensionAmount(calc.pension());
        payroll.setMedicalInsuranceAmount(calc.medicalInsurance());
        payroll.setOtherTaxedAmount(calc.otherDeduction());
        payroll.setNetSalary(calc.net());
        payroll.setMonth(request.month());
        payroll.setYear(request.year());
        return payroll;
    }

    private PayrollRates rates() {
        return new PayrollRates(deductionService.activeRate(DeductionCodes.EMPLOYEE_TAX),
                deductionService.activeRate(DeductionCodes.PENSION),
                deductionService.activeRate(DeductionCodes.MEDICAL_INSURANCE),
                deductionService.activeRate(DeductionCodes.CASH_ADVANCE));
    }

    private boolean employeeIsActive(Employment employment) {
        return employment.getEmployee().getStatus().name().equals("ACTIVE");
    }
}
