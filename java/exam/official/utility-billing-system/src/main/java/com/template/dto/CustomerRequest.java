package com.template.dto;

import com.template.validation.ValidName;
import com.template.validation.ValidNationalId;
import com.template.validation.ValidRwandanPhone;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CustomerRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @ValidName
    private String fullName;

    @NotBlank(message = "National ID is required")
    @ValidNationalId
    private String nationalId;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @ValidRwandanPhone
    private String phoneNumber;

    @NotBlank(message = "Address is required")
    @Size(min = 5, max = 255, message = "Address must be between 5 and 255 characters")
    private String address;

    @NotBlank(message = "District is required")
    @Size(min = 2, max = 100, message = "District must be between 2 and 100 characters")
    @ValidName
    private String district;
}
