package com.template.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 8, max = 128, message = "New password must be between 8 and 128 characters")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[0-9]).+$",
            message = "New password must contain at least one uppercase letter and one digit"
    )
    private String newPassword;
}
