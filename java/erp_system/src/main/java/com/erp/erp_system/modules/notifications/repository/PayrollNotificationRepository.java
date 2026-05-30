package com.erp.erp_system.modules.notifications.repository;

import com.erp.erp_system.modules.notifications.entity.PayrollNotification;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollNotificationRepository extends JpaRepository<PayrollNotification, Long> {
    boolean existsByPayrollId(Long payrollId);
}
