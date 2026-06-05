package com.template.dto;

import com.template.entity.BillingMode;
import com.template.entity.CompanyType;
import com.template.entity.UtilityType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class MeterRequest {

    @NotBlank(message = "Meter number is required")
    @Size(min = 4, max = 30, message = "Meter number must be between 4 and 30 characters")
    @Pattern(regexp = "^[A-Z0-9\\-]+$", message = "Meter number must contain only uppercase letters, digits, and hyphens")
    private String meterNumber;

    @NotNull(message = "Utility type is required")
    private UtilityType utilityType;

    @NotNull(message = "Billing mode is required")
    private BillingMode billingMode;

    @NotNull(message = "Company type is required")
    private CompanyType companyType;

    @NotNull(message = "Customer ID is required")
    private UUID customerId;

    @NotNull(message = "Installation date is required")
    @PastOrPresent(message = "Installation date cannot be in the future")
    private LocalDate installationDate;

    @NotBlank(message = "Installation address is required")
    @Size(min = 5, max = 255, message = "Installation address must be between 5 and 255 characters")
    private String installationAddress;
}
