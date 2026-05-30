package com.erp.erp_system.modules.notifications.entity;

import com.erp.erp_system.modules.payroll.entity.Payroll;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "payroll_notifications")
public class PayrollNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", nullable = false, unique = true)
    private Payroll payroll;

    @Column(nullable = false)
    private String recipientEmail;

    @Column(nullable = false, length = 600)
    private String message;

    @Column(nullable = false)
    private boolean sent;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
