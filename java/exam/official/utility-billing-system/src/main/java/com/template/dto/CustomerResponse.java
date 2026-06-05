package com.template.dto;

import com.template.entity.CustomerStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponse {

    @Schema(description = "Customer profile ID")
    private UUID customerId;

    @Schema(description = "Linked ROLE_CUSTOMER login account ID, when present")
    private UUID userId;
    private String customerNumber;
    private String fullName;
    private String nationalId;
    private String email;
    private String phoneNumber;
    private String address;
    private String district;
    private CustomerStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
