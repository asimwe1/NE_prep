package com.template.dto;

import com.template.entity.BillingMode;
import com.template.entity.CompanyType;
import com.template.entity.MeterStatus;
import com.template.entity.UtilityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeterResponse {

    private UUID id;
    private String meterNumber;
    private UtilityType utilityType;
    private BillingMode billingMode;
    private CompanyType company;
    private UUID customerId;
    private String customerNationalId;
    private String customerName;
    private String installationAddress;
    private LocalDate installationDate;
    private MeterStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
