package com.erp.erp_system.modules.deductions.service;

import com.erp.erp_system.common.exception.*;
import com.erp.erp_system.modules.deductions.dto.*;
import com.erp.erp_system.modules.deductions.entity.DeductionConfig;
import com.erp.erp_system.modules.deductions.mapper.DeductionMapper;
import com.erp.erp_system.modules.deductions.repository.DeductionConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeductionService {
    private final DeductionConfigRepository repository;

    /** Creates a deduction configuration. */
    @Transactional
    public DeductionResponse create(DeductionRequest request) {
        if (repository.existsByCode(request.code())) throw new DuplicateResourceException("Code exists");
        if (repository.existsByName(request.name())) throw new DuplicateResourceException("Name exists");
        return DeductionMapper.toResponse(repository.save(DeductionMapper.fromRequest(request)));
    }

    /** Updates a deduction configuration. */
    @Transactional
    public DeductionResponse update(Long id, DeductionRequest request) {
        DeductionConfig config = findEntity(id);
        DeductionMapper.update(config, request);
        return DeductionMapper.toResponse(config);
    }

    /** Lists deduction configurations. */
    public List<DeductionResponse> findAll() {
        return repository.findAll().stream().map(DeductionMapper::toResponse).toList();
    }

    /** Finds the active deduction percentage by code. */
    public BigDecimal activeRate(String code) {
        return repository.findByCodeAndActiveTrue(code)
                .orElseThrow(() -> new BusinessException("Missing active deduction rate: " + code))
                .getPercentage();
    }

    private DeductionConfig findEntity(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Deduction not found"));
    }
}
