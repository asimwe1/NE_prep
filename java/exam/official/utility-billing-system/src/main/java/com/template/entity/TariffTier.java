package com.template.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "tariff_tiers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TariffTier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tariff_id", nullable = false)
    private Tariff tariff;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal tierMin;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal tierMax;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPrice;
}
