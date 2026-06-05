package com.template.dto;

import com.template.entity.BillingMode;
import com.template.entity.CompanyType;
import com.template.entity.UtilityType;
import com.template.validation.ValidName;
import com.template.validation.ValidNationalId;
import io.swagger.v3.oas.annotations.media.Schema;
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

    @Schema(description = "Deprecated/internal fallback: customer profile ID or linked ROLE_CUSTOMER user ID. Prefer customerNationalId for Swagger/Postman use.")
    private UUID customerId;

    @Schema(description = "Preferred customer reference for meter assignment. If no customer profile exists yet, the system can create one from the registered ROLE_CUSTOMER user with this National ID.", example = "1199880200000100")
    @ValidNationalId
    private String customerNationalId;

    @Schema(description = "Required when customerNationalId belongs to a registered ROLE_CUSTOMER user that does not yet have a customer profile")
    @Size(min = 2, max = 100, message = "District must be between 2 and 100 characters")
    @ValidName
    private String customerDistrict;

    @NotNull(message = "Installation date is required")
    @PastOrPresent(message = "Installation date cannot be in the future")
    @Schema(type = "string", format = "date", example = "2026-06-07", description = "Installation date in yyyy-MM-dd format")
    private LocalDate installationDate;

    @NotBlank(message = "Installation address is required")
    @Size(min = 5, max = 255, message = "Installation address must be between 5 and 255 characters")
    private String installationAddress;
}
