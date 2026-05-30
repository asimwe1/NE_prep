package com.erp.erp_system.modules.employment.repository;

import com.erp.erp_system.modules.employment.entity.Employment;
import com.erp.erp_system.modules.employment.entity.EmploymentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmploymentRepository extends JpaRepository<Employment, Long> {
    @Override
    @EntityGraph(attributePaths = "employee")
    List<Employment> findAll();

    boolean existsByCode(String code);

    @EntityGraph(attributePaths = "employee")
    List<Employment> findByStatus(EmploymentStatus status);

    @EntityGraph(attributePaths = "employee")
    Optional<Employment> findWithEmployeeById(Long id);
}
