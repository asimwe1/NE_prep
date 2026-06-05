package com.template.repository;

import com.template.entity.Item;
import com.template.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID> {

    Page<Item> findAllByActiveTrue(Pageable pageable);

    Page<Item> findAllByCreatedBy(User user, Pageable pageable);

    boolean existsByNameIgnoreCase(String name);
}
