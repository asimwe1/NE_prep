package com.template.service;

import com.template.dto.CustomerCreateRequest;
import com.template.dto.CustomerResponse;
import com.template.dto.CustomerUpdateRequest;
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
    public CustomerResponse createCustomer(CustomerCreateRequest request) {
        if (customerRepository.existsByNationalId(request.getNationalId())) {
            throw new DuplicateNationalIdException(request.getNationalId());
        }
        User linkedUser = resolveLinkedCustomerUser(request.getUserId());
        syncLinkedUserNationalId(linkedUser, request.getNationalId());
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
     * @param customerId customer profile ID or linked user ID
     * @param request    validated update payload
     * @return updated customer DTO
     * @throws ResourceNotFoundException    if no customer with the given ID exists
     * @throws DuplicateNationalIdException if the new national ID belongs to another customer
     */
    @Transactional
    public CustomerResponse updateCustomer(UUID customerId, CustomerUpdateRequest request) {
        Customer customer = findOrThrow(customerId);
        if (!customer.getNationalId().equals(request.getNationalId())
                && customerRepository.existsByNationalId(request.getNationalId())) {
            throw new DuplicateNationalIdException(request.getNationalId());
        }
        User linkedUser = customer.getUser();
        syncLinkedUserNationalId(linkedUser, request.getNationalId());
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

    public CustomerResponse getById(UUID customerId) {
        return toResponse(findOrThrow(customerId));
    }

    public CustomerResponse getByNationalId(String nationalId) {
        return toResponse(findByNationalIdOrThrow(nationalId));
    }

    @Transactional
    public CustomerResponse activate(UUID customerId) {
        Customer customer = findOrThrow(customerId);
        customer.setStatus(CustomerStatus.ACTIVE);
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerResponse deactivate(UUID customerId) {
        Customer customer = findOrThrow(customerId);
        customer.setStatus(CustomerStatus.INACTIVE);
        return toResponse(customerRepository.save(customer));
    }

    /** Guard used by BillService before generating bills. */
    public void validateCustomerIsActive(Customer customer) {
        if (customer.getStatus() != CustomerStatus.ACTIVE) {
            throw new InactiveCustomerException(customer.getCustomerNumber());
        }
    }

    public Customer findOrThrow(UUID customerId) {
        return customerRepository.findById(customerId)
                .or(() -> customerRepository.findByUserId(customerId))
                .orElseThrow(() -> {
                    if (userRepository.existsById(customerId)) {
                        return new ResourceNotFoundException("Customer profile for user", customerId);
                    }
                    return new ResourceNotFoundException("Customer", customerId);
                });
    }

    public Customer findByNationalIdOrThrow(String nationalId) {
        return customerRepository.findByNationalId(nationalId.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Customer with national ID", nationalId));
    }

    @Transactional
    public Customer findOrCreateForMeterAssignment(UUID customerId, String nationalId, String address, String district) {
        if (hasText(nationalId)) {
            return findOrCreateForMeterAssignmentByNationalId(nationalId, address, district);
        }
        if (customerId == null) {
            throw new IllegalArgumentException("Provide customerNationalId to assign a meter. customerId is only an internal fallback.");
        }
        return customerRepository.findById(customerId)
                .or(() -> customerRepository.findByUserId(customerId))
                .orElseGet(() -> createProfileForCustomerUser(customerId, nationalId, address, district));
    }

    @Transactional
    public Customer findOrCreateForMeterAssignmentByNationalId(String nationalId, String address, String district) {
        String normalizedNationalId = nationalId.trim();
        return customerRepository.findByNationalId(normalizedNationalId)
                .orElseGet(() -> createProfileForCustomerUserByNationalId(normalizedNationalId, address, district));
    }

    private CustomerResponse toResponse(Customer c) {
        return CustomerResponse.builder()
                .customerId(c.getId())
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

    private void syncLinkedUserNationalId(User user, String nationalId) {
        if (user == null) {
            return;
        }
        String normalizedNationalId = nationalId.trim();
        if (hasText(user.getNationalId()) && !user.getNationalId().equals(normalizedNationalId)) {
            throw new IllegalArgumentException("Linked user National ID must match the customer National ID.");
        }
        if (!hasText(user.getNationalId())) {
            user.setNationalId(normalizedNationalId);
            userRepository.save(user);
        }
    }

    private Customer createProfileForCustomerUser(UUID userId, String nationalId, String address, String district) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile or user", userId));
        String resolvedNationalId = hasText(nationalId) ? nationalId.trim() : user.getNationalId();
        return createProfileForCustomerUser(user, resolvedNationalId, address, district);
    }

    private Customer createProfileForCustomerUserByNationalId(String nationalId, String address, String district) {
        User user = userRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer profile or user with national ID", nationalId));
        return createProfileForCustomerUser(user, nationalId, address, district);
    }

    private Customer createProfileForCustomerUser(User user, String nationalId, String address, String district) {
        if (user.getRole() != Role.ROLE_CUSTOMER) {
            throw new IllegalArgumentException("Only ROLE_CUSTOMER users can own meters. ROLE_OPERATOR users capture readings; they do not own customer meters.");
        }
        if (!hasText(nationalId) || !hasText(district)) {
            throw new IllegalArgumentException("Customer profile is missing for this National ID. Provide customerDistrict on meter assignment, or create the customer profile first.");
        }
        if (customerRepository.existsByNationalId(nationalId.trim())) {
            throw new DuplicateNationalIdException(nationalId);
        }
        Customer customer = Customer.builder()
                .user(user)
                .customerNumber(generateCustomerNumber())
                .fullName(user.getFullName().trim())
                .nationalId(nationalId.trim())
                .email(user.getEmail().trim().toLowerCase())
                .phoneNumber(user.getPhoneNumber().trim())
                .address(address.trim())
                .district(district.trim())
                .status(CustomerStatus.ACTIVE)
                .build();
        return customerRepository.save(customer);
    }

    private String valueOrUserFullName(CustomerCreateRequest request, User user) {
        return user == null ? request.getFullName().trim() : user.getFullName().trim();
    }

    private String valueOrUserEmail(CustomerCreateRequest request, User user) {
        return user == null ? request.getEmail().trim().toLowerCase() : user.getEmail().trim().toLowerCase();
    }

    private String valueOrUserPhone(CustomerCreateRequest request, User user) {
        return user == null ? request.getPhoneNumber().trim() : user.getPhoneNumber().trim();
    }

    private String valueOrUserFullName(CustomerUpdateRequest request, User user) {
        return user == null ? request.getFullName().trim() : user.getFullName().trim();
    }

    private String valueOrUserEmail(CustomerUpdateRequest request, User user) {
        return user == null ? request.getEmail().trim().toLowerCase() : user.getEmail().trim().toLowerCase();
    }

    private String valueOrUserPhone(CustomerUpdateRequest request, User user) {
        return user == null ? request.getPhoneNumber().trim() : user.getPhoneNumber().trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
