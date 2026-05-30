package com.erp.erp_system.modules.payroll.mapper;

import com.erp.erp_system.modules.payroll.dto.PayrollResponse;
import com.erp.erp_system.modules.payroll.entity.Payroll;

public class PayrollMapper {
    private PayrollMapper() {
    }

    /** Maps payroll data to a payslip-friendly response. */
    public static PayrollResponse toResponse(Payroll payroll) {
        var employee = payroll.getEmployee();
        String name = employee.getFirstName() + " " + employee.getLastName();
        return new PayrollResponse(payroll.getId(), employee.getCode(), name, payroll.getBaseSalary(),
                payroll.getHousingAmount(), payroll.getTransportAmount(), payroll.getGrossSalary(),
                payroll.getEmployeeTaxedAmount(), payroll.getPensionAmount(),
                payroll.getMedicalInsuranceAmount(), payroll.getOtherTaxedAmount(),
                payroll.getNetSalary(), payroll.getMonth(), payroll.getYear(), payroll.getStatus());
    }
}
