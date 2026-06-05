package com.template.repository;

import com.template.entity.Customer;
import com.template.entity.CustomerNotification;
import com.template.entity.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CustomerNotificationRepository extends JpaRepository<CustomerNotification, UUID> {
    List<CustomerNotification> findByCustomerOrderByCreatedAtDesc(Customer customer);
    List<CustomerNotification> findByStatus(NotificationStatus status);
}
