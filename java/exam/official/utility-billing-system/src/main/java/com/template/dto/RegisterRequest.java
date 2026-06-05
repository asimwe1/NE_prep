package com.template.dto;

import com.template.validation.ValidName;
import com.template.validation.ValidNationalId;
import com.template.validation.ValidRwandanPhone;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[0-9]).+$",
            message = "Password must contain at least one uppercase letter and one digit"
    )
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    @ValidName
    private String fullName;

    @NotBlank(message = "Phone number is required")
    @ValidRwandanPhone
    private String phoneNumber;

    @Schema(description = "Customer-facing National ID used later for meters, bills, and notifications", example = "1199880200000100")
    @NotBlank(message = "National ID is required")
    @ValidNationalId
    private String nationalId;
}
