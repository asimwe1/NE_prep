package com.template.dto;

import com.template.validation.ValidName;
import com.template.validation.ValidRwandanPhone;
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
}
