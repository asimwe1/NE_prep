package com.template.service;

import com.template.dto.CustomerRequest;
import com.template.dto.CustomerResponse;
import com.template.entity.Customer;
import com.template.entity.CustomerStatus;
import com.template.entity.Role;
import com.template.entity.User;
import com.template.exception.DuplicateNationalIdException;
import com.template.exception.InactiveCustomerException;
import com.template.exception.ResourceNotFoundException;
import com.template.repository.CustomerRepository;
import com.template.repository.UserRepository;
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
    private final UserRepository userRepository;

    /**
     * Creates a new customer after validating uniqueness of the national ID.
     *
     * @param request validated customer creation payload
     * @return the persisted customer as a response DTO
     * @throws DuplicateNationalIdException if the national ID is already registered
     */
    @Transactional
    public CustomerResponse createCustomer(CustomerRequest request) {
        if (customerRepository.existsByNationalId(request.getNationalId())) {
            throw new DuplicateNationalIdException(request.getNationalId());
        }
        User linkedUser = resolveLinkedCustomerUser(request.getUserId());
        Customer customer = Customer.builder()
                .user(linkedUser)
                .customerNumber(generateCustomerNumber())
                .fullName(valueOrUserFullName(request, linkedUser))
                .nationalId(request.getNationalId().trim())
                .email(valueOrUserEmail(request, linkedUser))
                .phoneNumber(valueOrUserPhone(request, linkedUser))
                .address(request.getAddress().trim())
                .district(request.getDistrict().trim())
                .status(CustomerStatus.ACTIVE)
                .build();
        return toResponse(customerRepository.save(customer));
    }

    /**
     * Updates an existing customer's details. The national ID can be changed only if
     * the new value is not already in use by another customer.
     *
     * @param id      customer UUID
     * @param request validated update payload
     * @return updated customer DTO
     * @throws ResourceNotFoundException    if no customer with the given ID exists
     * @throws DuplicateNationalIdException if the new national ID belongs to another customer
     */
    @Transactional
    public CustomerResponse updateCustomer(UUID id, CustomerRequest request) {
        Customer customer = findOrThrow(id);
        if (!customer.getNationalId().equals(request.getNationalId())
                && customerRepository.existsByNationalId(request.getNationalId())) {
            throw new DuplicateNationalIdException(request.getNationalId());
        }
        User linkedUser = customer.getUser();
        if (request.getUserId() != null
                && (linkedUser == null || !linkedUser.getId().equals(request.getUserId()))) {
            linkedUser = resolveLinkedCustomerUser(request.getUserId());
            customer.setUser(linkedUser);
        }
        customer.setFullName(valueOrUserFullName(request, linkedUser));
        customer.setNationalId(request.getNationalId().trim());
        customer.setEmail(valueOrUserEmail(request, linkedUser));
        customer.setPhoneNumber(valueOrUserPhone(request, linkedUser));
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

    public Customer findOrThrow(UUID id) {
        return customerRepository.findById(id)
                .or(() -> customerRepository.findByUserId(id))
                .orElseThrow(() -> {
                    if (userRepository.existsById(id)) {
                        return new ResourceNotFoundException("Customer profile for user", id);
                    }
                    return new ResourceNotFoundException("Customer", id);
                });
    }

    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.builder()
                .id(c.getId())
                .userId(c.getUser() == null ? null : c.getUser().getId())
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

    private User resolveLinkedCustomerUser(UUID userId) {
        if (userId == null) {
            return null;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (user.getRole() != Role.ROLE_CUSTOMER) {
            throw new IllegalArgumentException("Only ROLE_CUSTOMER users can be linked to customer profiles.");
        }
        if (customerRepository.existsByUserId(userId)) {
            throw new IllegalArgumentException("This user already has a customer profile.");
        }
        return user;
    }

    private String valueOrUserFullName(CustomerRequest request, User user) {
        return user == null ? request.getFullName().trim() : user.getFullName().trim();
    }

    private String valueOrUserEmail(CustomerRequest request, User user) {
        return user == null ? request.getEmail().trim().toLowerCase() : user.getEmail().trim().toLowerCase();
    }

    private String valueOrUserPhone(CustomerRequest request, User user) {
        return user == null ? request.getPhoneNumber().trim() : user.getPhoneNumber().trim();
    }
}
