package com.template.repository;

import com.template.entity.Tariff;
import com.template.entity.TariffTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TariffTierRepository extends JpaRepository<TariffTier, UUID> {

    List<TariffTier> findByTariffOrderByTierMinAsc(Tariff tariff);
}
