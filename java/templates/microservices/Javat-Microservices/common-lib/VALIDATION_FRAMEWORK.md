# Validation Framework Documentation

## Overview

The common-lib provides a comprehensive validation framework that includes:
- All standard Bean Validation annotations (@Valid, @NotNull, @NotBlank, @Email, etc.)
- Custom validation annotations for common use cases
- Automatic validation error handling via GlobalExceptionHandler
- Validation groups for different scenarios
- Programmatic validation utilities

## Standard Bean Validation Annotations

### Already Available (from `spring-boot-starter-validation`)

```java
@NotNull        // Value cannot be null
@NotBlank       // String cannot be null, empty, or whitespace
@NotEmpty       // Collection/array/string cannot be null or empty
@Email          // Valid email format
@Size           // String/collection size constraints
@Min            // Minimum numeric value
@Max            // Maximum numeric value
@Positive       // Positive number (> 0)
@PositiveOrZero // Positive or zero (>= 0)
@Negative       // Negative number (< 0)
@NegativeOrZero // Negative or zero (<= 0)
@Past           // Date in the past
@PastOrPresent  // Date in the past or present
@Future         // Date in the future
@FutureOrPresent// Date in the future or present
@Pattern        // Regex pattern matching
@DecimalMin     // Decimal minimum value
@DecimalMax     // Decimal maximum value
@Digits         // Number of integer and fraction digits
```

## Custom Validation Annotations

### 1. @ValidPassword
Validates password strength with customizable requirements.

```java
@ValidPassword
private String password;

// With custom requirements
@ValidPassword(
    minLength = 10,
    requireUppercase = true,
    requireLowercase = true,
    requireDigit = true,
    requireSpecialChar = true
)
private String password;
```

**Default Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (!@#$%^&*()_+-=[]{};':"\|,.<>/?)

### 2. @ValidEnum
Validates that a string value matches an enum constant.

```java
public enum UserStatus {
    ACTIVE, INACTIVE, PENDING, SUSPENDED
}

@ValidEnum(enumClass = UserStatus.class)
private String status;

// Case-insensitive matching
@ValidEnum(enumClass = UserStatus.class, ignoreCase = true)
private String status;
```

### 3. @ValidPhoneNumber
Validates E.164 international phone number format.

```java
@ValidPhoneNumber
private String phoneNumber;  // Valid: +1234567890, +12025551234
```

### 4. @FieldMatch (Class-level)
Validates that two fields have the same value (e.g., password confirmation).

```java
@Data
@FieldMatch(first = "password", second = "confirmPassword", 
            message = "Passwords do not match")
public class RegisterRequest {
    @ValidPassword
    private String password;
    
    private String confirmPassword;
}
```

### 5. @ValidDateRange (Class-level)
Validates that start date is before or equal to end date.

```java
@Data
@ValidDateRange(start = "startDate", end = "endDate",
                message = "Start date must be before end date")
public class DateRangeRequest {
    @NotNull
    private LocalDate startDate;
    
    @NotNull
    private LocalDate endDate;
}
```

## Usage Examples

### Basic Controller with Validation

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        // Validation automatically happens before method execution
        // If validation fails, GlobalExceptionHandler catches it
        
        UserDTO user = userService.createUser(request);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
```

### Request DTO with Validations

```java
@Data
@FieldMatch(first = "password", second = "confirmPassword")
public class RegisterRequest {
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @ValidPassword
    private String password;
    
    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;
    
    @ValidPhoneNumber
    private String phoneNumber;
    
    @NotNull
    @Past(message = "Birth date must be in the past")
    private LocalDate birthDate;
    
    @ValidEnum(enumClass = Gender.class)
    private String gender;
}
```

### Validation with Groups

```java
@Data
public class UserRequest {
    
    // ID not required for create, but required for update
    @Null(groups = ValidationGroups.Create.class)
    @NotNull(groups = ValidationGroups.Update.class)
    private Long id;
    
    @NotBlank(groups = {ValidationGroups.Create.class, ValidationGroups.Update.class})
    @Size(min = 3, max = 50)
    private String username;
    
    // Email required for create, optional for update
    @NotBlank(groups = ValidationGroups.Create.class)
    @Email
    private String email;
}

// In controller
@PostMapping
public ResponseEntity<ApiResponse<UserDTO>> createUser(
        @Validated(ValidationGroups.Create.class) @RequestBody UserRequest request) {
    // ...
}

@PutMapping("/{id}")
public ResponseEntity<ApiResponse<UserDTO>> updateUser(
        @PathVariable Long id,
        @Validated(ValidationGroups.Update.class) @RequestBody UserRequest request) {
    // ...
}
```

### Programmatic Validation

```java
@Service
public class UserService {
    
    @Autowired
    private Validator validator;
    
    public void processUser(UserRequest request) {
        // Validate programmatically
        ValidationUtil.validate(request, validator);
        
        // Or with validation groups
        ValidationUtil.validate(request, validator, ValidationGroups.Create.class);
        
        // Check if valid without throwing exception
        if (!ValidationUtil.isValid(request, validator)) {
            Map<String, String> errors = ValidationUtil.getValidationErrors(request, validator);
            // Handle errors...
        }
    }
}
```

## Validation Response Format

When validation fails, the GlobalExceptionHandler automatically returns:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "statusCode": 400,
  "timestamp": "2026-06-04T14:30:00.000Z",
  "path": "/api/users",
  "validationErrors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character",
    "phoneNumber": "Invalid phone number format. Use E.164 format (e.g., +1234567890)",
    "confirmPassword": "Passwords do not match"
  }
}
```

## Creating Custom Validators

### Step 1: Create Annotation

```java
@Documented
@Constraint(validatedBy = CustomValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCustom {
    String message() default "Invalid value";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    
    // Custom attributes
    String customAttribute() default "";
}
```

### Step 2: Create Validator

```java
public class CustomValidator implements ConstraintValidator<ValidCustom, String> {
    
    private String customAttribute;
    
    @Override
    public void initialize(ValidCustom constraintAnnotation) {
        this.customAttribute = constraintAnnotation.customAttribute();
    }
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true; // Use @NotNull/@NotBlank separately
        }
        
        // Your validation logic here
        return true;
    }
}
```

### Step 3: Use It

```java
@ValidCustom(customAttribute = "someValue")
private String myField;
```

## Validation Groups

Use `ValidationGroups` interface for different scenarios:

```java
// Create operation
@Validated(ValidationGroups.Create.class)

// Update operation
@Validated(ValidationGroups.Update.class)

// Partial update (PATCH)
@Validated(ValidationGroups.PartialUpdate.class)

// Delete operation
@Validated(ValidationGroups.Delete.class)

// Multiple groups
@Validated({ValidationGroups.Create.class, SomeOtherGroup.class})
```

## Best Practices

1. **Use @Valid for nested objects**
   ```java
   @Valid
   @NotNull
   private Address address;
   ```

2. **Provide meaningful error messages**
   ```java
   @NotBlank(message = "Username is required and cannot be empty")
   @Size(min = 3, max = 50, message = "Username must be between {min} and {max} characters")
   ```

3. **Use validation groups for different operations**
   - Separate create and update validations
   - Different rules for partial updates (PATCH)

4. **Combine multiple validators**
   ```java
   @NotBlank
   @Email
   @Size(max = 100)
   private String email;
   ```

5. **Validate collections**
   ```java
   @NotEmpty(message = "At least one item is required")
   @Size(max = 10, message = "Maximum 10 items allowed")
   private List<@Valid ItemDTO> items;
   ```

6. **Use class-level validators for complex logic**
   - Field matching (@FieldMatch)
   - Date range validation (@ValidDateRange)
   - Cross-field validation

## Testing Validation

```java
@SpringBootTest
class ValidationTest {
    
    @Autowired
    private Validator validator;
    
    @Test
    void testInvalidEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("invalid-email");
        
        Set<ConstraintViolation<RegisterRequest>> violations = 
            validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("email")));
    }
}
```

## Summary

✅ **Standard Annotations**: All Bean Validation annotations available  
✅ **Custom Validators**: 5 production-ready custom validators  
✅ **Automatic Error Handling**: GlobalExceptionHandler catches validation errors  
✅ **Validation Groups**: Support for different operation scenarios  
✅ **Programmatic Validation**: ValidationUtil for manual validation  
✅ **Consistent Responses**: Standardized error format with field details  
✅ **Extensible**: Easy to add new custom validators

**Every service that imports common-lib automatically gets:**
- Full validation framework
- Custom validators
- Automatic error handling
- Consistent validation responses
