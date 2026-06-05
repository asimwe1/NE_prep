package com.template.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "meter_readings",
        uniqueConstraints = @UniqueConstraint(columnNames = {"meter_id", "billing_month"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeterReading {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_id", nullable = false)
    private UtilityMeter meter;

    @Column(name = "billing_month", nullable = false)
    private LocalDate billingMonth;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal previousReading;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal currentReading;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal consumption;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (consumption == null && previousReading != null && currentReading != null) {
            consumption = currentReading.subtract(previousReading);
        }
    }
}
