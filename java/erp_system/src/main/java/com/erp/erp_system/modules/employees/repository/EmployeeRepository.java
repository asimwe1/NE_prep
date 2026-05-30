package com.erp.erp_system.modules.employees.repository;

import com.erp.erp_system.modules.employees.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByCode(String code);

    boolean existsByEmail(String email);

    Optional<Employee> findByCode(String code);

    Optional<Employee> findByEmail(String email);
}
