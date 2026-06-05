package com.template.service;

import com.template.dto.CustomerRequest;
import com.template.dto.CustomerResponse;
import com.template.entity.Customer;
import com.template.entity.CustomerStatus;
import com.template.exception.DuplicateNationalIdException;
import com.template.exception.InactiveCustomerException;
import com.template.exception.ResourceNotFoundException;
import com.template.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        if (customerRepository.existsByNationalId(request.getNationalId())) {
            throw new DuplicateNationalIdException(request.getNationalId());
        }
        Customer customer = Customer.builder()
                .customerNumber(generateCustomerNumber())
                .fullName(request.getFullName().trim())
                .nationalId(request.getNationalId().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phoneNumber(request.getPhoneNumber().trim())
                .address(request.getAddress().trim())
                .district(request.getDistrict().trim())
                .status(CustomerStatus.ACTIVE)
                .build();
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse updateCustomer(UUID id, CustomerRequest request) {
        Customer customer = findOrThrow(id);
        if (!customer.getNationalId().equals(request.getNationalId())
                && customerRepository.existsByNationalId(request.getNationalId())) {
            throw new DuplicateNationalIdException(request.getNationalId());
        }
        customer.setFullName(request.getFullName().trim());
        customer.setNationalId(request.getNationalId().trim());
        customer.setEmail(request.getEmail().trim().toLowerCase());
        customer.setPhoneNumber(request.getPhoneNumber().trim());
        customer.setAddress(request.getAddress().trim());
        customer.setDistrict(request.getDistrict().trim());
        return toResponse(customerRepository.save(customer));
    }

    public Page<CustomerResponse> listCustomers(Pageable pageable) {
        return customerRepository.findAll(pageable).map(this::toResponse);
    }

    public CustomerResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public CustomerResponse getByNationalId(String nationalId) {
        Customer customer = customerRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer with national ID", nationalId));
        return toResponse(customer);
    }

    @Transactional
    public CustomerResponse activate(UUID id) {
        Customer customer = findOrThrow(id);
        customer.setStatus(CustomerStatus.ACTIVE);
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse deactivate(UUID id) {
        Customer customer = findOrThrow(id);
        customer.setStatus(CustomerStatus.INACTIVE);
        return toResponse(customerRepository.save(customer));
    }

    /** Guard used by BillService before generating bills. */
    public void validateCustomerIsActive(Customer customer) {
        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new InactiveCustomerException(customer.getCustomerNumber());
        }
    }

    // ─── Internal helpers ────────────────────────────────────────────────────

    public Customer findOrThrow(UUID id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.builder()
                .id(c.getId())
                .customerNumber(c.getCustomerNumber())
                .fullName(c.getFullName())
                .nationalId(c.getNationalId())
                .email(c.getEmail())
                .phoneNumber(c.getPhoneNumber())
                .address(c.getAddress())
                .district(c.getDistrict())
                .status(c.getStatus())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private String generateCustomerNumber() {
        String prefix = "CUST-";
        String candidate;
        do {
            candidate = prefix + String.format("%06d", (long) (Math.random() * 1_000_000));
        } while (customerRepository.existsByCustomerNumber(candidate));
        return candidate;
    }
}
