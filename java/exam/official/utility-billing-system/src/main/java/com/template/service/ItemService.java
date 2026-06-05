package com.template.service;

import com.template.dto.ItemRequest;
import com.template.dto.ItemResponse;
import com.template.entity.Item;
import com.template.entity.User;
import com.template.exception.ResourceNotFoundException;
import com.template.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Example CRUD service. Copy, rename, and adapt for your domain entities.
 */
@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;

    public Page<ItemResponse> getAll(Pageable pageable) {
        return itemRepository.findAllByActiveTrue(pageable).map(this::toResponse);
    }

    public ItemResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ItemResponse create(ItemRequest request, User currentUser) {
        Item item = Item.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .createdBy(currentUser)
                .build();
        return toResponse(itemRepository.save(item));
    }

    @Transactional
    public ItemResponse update(UUID id, ItemRequest request) {
        Item item = findOrThrow(id);
        item.setName(request.getName().trim());
        item.setDescription(request.getDescription());
        return toResponse(itemRepository.save(item));
    }

    @Transactional
    public void delete(UUID id) {
        Item item = findOrThrow(id);
        item.setActive(false);          // soft delete
        itemRepository.save(item);
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private ItemResponse toResponse(Item item) {
        return ItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .active(item.isActive())
                .createdByEmail(item.getCreatedBy() != null ? item.getCreatedBy().getEmail() : null)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private Item findOrThrow(UUID id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));
    }
}
