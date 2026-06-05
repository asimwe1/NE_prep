package com.template.service;

import com.template.dto.MeterRequest;
import com.template.dto.MeterResponse;
import com.template.entity.Customer;
import com.template.entity.MeterStatus;
import com.template.entity.UtilityMeter;
import com.template.exception.DuplicateMeterNumberException;
import com.template.exception.ResourceNotFoundException;
import com.template.repository.UtilityMeterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeterService {

    private final UtilityMeterRepository meterRepository;
    private final CustomerService customerService;

    /**
     * Assigns a new utility meter to an existing customer.
     * The meter number must be globally unique across all meter types.
     *
     * @param request validated meter assignment payload
     * @return the persisted meter as a response DTO
     * @throws DuplicateMeterNumberException if the meter number already exists
     * @throws ResourceNotFoundException     if the referenced customer does not exist
     */
    @Transactional
    public MeterResponse assignMeter(MeterRequest request) {
        if (meterRepository.existsByMeterNumber(request.getMeterNumber())) {
            throw new DuplicateMeterNumberException(request.getMeterNumber());
        }
        Customer customer = customerService.findOrCreateForMeterAssignment(
                request.getCustomerId(),
                request.getCustomerNationalId(),
                request.getInstallationAddress(),
                request.getCustomerDistrict()
        );
        UtilityMeter meter = UtilityMeter.builder()
                .meterNumber(request.getMeterNumber().trim())
                .utilityType(request.getUtilityType())
                .billingMode(request.getBillingMode())
                .company(request.getCompanyType())
                .customer(customer)
                .installationDate(request.getInstallationDate())
                .installationAddress(request.getInstallationAddress().trim())
                .status(MeterStatus.ACTIVE)
                .build();
        return toResponse(meterRepository.save(meter));
    }

    @Transactional
    public MeterResponse updateMeter(UUID id, MeterRequest request) {
        UtilityMeter meter = findOrThrow(id);
        if (!meter.getMeterNumber().equals(request.getMeterNumber())
                && meterRepository.existsByMeterNumber(request.getMeterNumber())) {
            throw new DuplicateMeterNumberException(request.getMeterNumber());
        }
        Customer customer = customerService.findOrCreateForMeterAssignment(
                request.getCustomerId(),
                request.getCustomerNationalId(),
                request.getInstallationAddress(),
                request.getCustomerDistrict()
        );
        meter.setMeterNumber(request.getMeterNumber().trim());
        meter.setUtilityType(request.getUtilityType());
        meter.setBillingMode(request.getBillingMode());
        meter.setCompany(request.getCompanyType());
        meter.setCustomer(customer);
        meter.setInstallationDate(request.getInstallationDate());
        meter.setInstallationAddress(request.getInstallationAddress().trim());
        return toResponse(meterRepository.save(meter));
    }

    public Page<MeterResponse> listMeters(Pageable pageable) {
        return meterRepository.findAll(pageable).map(this::toResponse);
    }

    public List<MeterResponse> listByCustomer(UUID customerId) {
        Customer customer = customerService.findOrThrow(customerId);
        return meterRepository.findByCustomer(customer)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<MeterResponse> listByCustomerNationalId(String nationalId) {
        Customer customer = customerService.findByNationalIdOrThrow(nationalId);
        return meterRepository.findByCustomer(customer)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MeterResponse activate(UUID id) {
        UtilityMeter meter = findOrThrow(id);
        meter.setStatus(MeterStatus.ACTIVE);
        return toResponse(meterRepository.save(meter));
    }

    @Transactional
    public MeterResponse deactivate(UUID id) {
        UtilityMeter meter = findOrThrow(id);
        meter.setStatus(MeterStatus.INACTIVE);
        return toResponse(meterRepository.save(meter));
    }

    public UtilityMeter findOrThrow(UUID id) {
        return meterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meter", id));
    }

    private MeterResponse toResponse(UtilityMeter m) {
        return MeterResponse.builder()
                .id(m.getId())
                .meterNumber(m.getMeterNumber())
                .utilityType(m.getUtilityType())
                .billingMode(m.getBillingMode())
                .company(m.getCompany())
                .customerId(m.getCustomer().getId())
                .customerNationalId(m.getCustomer().getNationalId())
                .customerName(m.getCustomer().getFullName())
                .installationAddress(m.getInstallationAddress())
                .installationDate(m.getInstallationDate())
                .status(m.getStatus())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }
}
