package com.template.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "tariffs")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tariff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String tariffCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UtilityType utilityType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillingMode billingMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TariffType tariffType;

    @Column(nullable = false)
    private Integer version;

    /** Stored as "YYYY-MM" string for simplicity with YearMonth. */
    @Column(nullable = false, length = 7)
    private String effectiveStartCycle;

    /** Null means open-ended tariff. */
    @Column(length = 7)
    private String effectiveEndCycle;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal fixedServiceCharge;

    /** VAT percentage (e.g. 18.00 means 18%). */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Column(nullable = false)
    private boolean active;

    @OneToMany(mappedBy = "tariff", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TariffTier> tiers = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        active = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
