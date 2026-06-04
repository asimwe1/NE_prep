# Global Exception Handling Documentation

## Overview

The `GlobalExceptionHandler` provides centralized exception handling for all microservices using Spring's `@RestControllerAdvice`. All exceptions are automatically caught and converted to standardized `ErrorResponse` objects.

## Supported Exception Types

### ✅ Custom Business Exceptions

| Exception | HTTP Status | Error Code | Use Case |
|-----------|-------------|------------|----------|
| `BusinessException` | 400 | BUSINESS_ERROR | Generic business logic errors |
| `ResourceNotFoundException` | 404 | RESOURCE_NOT_FOUND | Entity/resource not found |
| `UnauthorizedException` | 401 | UNAUTHORIZED | Authentication failures |
| `ForbiddenException` | 403 | FORBIDDEN | Authorization failures |
| `ValidationException` | 400 | VALIDATION_ERROR | Custom validation errors with field-level details |

### ✅ Spring Security Exceptions

| Exception | HTTP Status | Error Code | Description |
|-----------|-------------|------------|-------------|
| `AccessDeniedException` | 403 | ACCESS_DENIED | User lacks permission for resource |
| `AuthenticationException` | 401 | AUTHENTICATION_FAILED | Authentication process failed |

### ✅ Spring Validation Exceptions

| Exception | HTTP Status | Error Code | Description |
|-----------|-------------|------------|-------------|
| `MethodArgumentNotValidException` | 400 | VALIDATION_ERROR | Bean validation (@Valid) failures |

### ✅ HTTP Protocol Exceptions

| Exception | HTTP Status | Error Code | Description |
|-----------|-------------|------------|-------------|
| `HttpRequestMethodNotSupportedException` | 405 | METHOD_NOT_ALLOWED | Wrong HTTP method used |
| `HttpMediaTypeNotSupportedException` | 415 | UNSUPPORTED_MEDIA_TYPE | Wrong Content-Type header |
| `HttpMessageNotReadableException` | 400 | MALFORMED_REQUEST | Invalid JSON or request body |
| `MissingServletRequestParameterException` | 400 | MISSING_PARAMETER | Required parameter missing |
| `MethodArgumentTypeMismatchException` | 400 | TYPE_MISMATCH | Parameter type conversion failed |
| `NoHandlerFoundException` | 404 | ENDPOINT_NOT_FOUND | Endpoint doesn't exist |

### ✅ Java Standard Exceptions

| Exception | HTTP Status | Error Code | Description |
|-----------|-------------|------------|-------------|
| `IllegalArgumentException` | 400 | ILLEGAL_ARGUMENT | Invalid method arguments |
| `IllegalStateException` | 500 | ILLEGAL_STATE | Application in invalid state |

### ✅ Catch-All

| Exception | HTTP Status | Error Code | Description |
|-----------|-------------|------------|-------------|
| `Exception` | 500 | INTERNAL_SERVER_ERROR | Any uncaught exception |

## Response Format

All exceptions return a standardized `ErrorResponse`:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2026-06-04T10:30:00.000Z",
  "path": "/api/users/123"
}
```

### With Validation Errors

For validation failures, the response includes field-level details:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "statusCode": 400,
  "timestamp": "2026-06-04T10:30:00.000Z",
  "path": "/api/users",
  "validationErrors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters",
    "username": "Username is required"
  }
}
```

## Usage Examples

### 1. Using Custom Exceptions

```java
@Service
public class UserService {
    
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }
    
    public void updateUser(Long id, UserDTO dto) {
        User user = getUserById(id);
        
        if (!user.isActive()) {
            throw new BusinessException("Cannot update inactive user", 
                "USER_INACTIVE", HttpStatus.BAD_REQUEST);
        }
        
        // Update logic...
    }
    
    public void deleteUser(Long id, User currentUser) {
        if (!currentUser.hasRole("ADMIN")) {
            throw new ForbiddenException("Only admins can delete users");
        }
        
        // Delete logic...
    }
}
```

### 2. Using Validation Exception

```java
@Service
public class ValidationService {
    
    public void validatePasswordReset(String email, String token) {
        Map<String, String> errors = new HashMap<>();
        
        if (!isValidEmail(email)) {
            errors.put("email", "Invalid email format");
        }
        
        if (isTokenExpired(token)) {
            errors.put("token", "Reset token has expired");
        }
        
        if (!errors.isEmpty()) {
            throw new ValidationException("Password reset validation failed", errors);
        }
    }
}
```

### 3. Using Bean Validation (@Valid)

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> createUser(@Valid @RequestBody CreateUserRequest request) {
        // If validation fails, GlobalExceptionHandler automatically catches
        // MethodArgumentNotValidException and returns formatted error response
        
        UserDTO user = userService.createUser(request);
        return ResponseEntity.ok(ApiResponse.success(user, "User created successfully"));
    }
}

// Request DTO with validation annotations
@Data
public class CreateUserRequest {
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
```

### 4. Handling Security Exceptions

Security exceptions are automatically caught:

```java
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")  // Throws AccessDeniedException if user isn't admin
public class AdminController {
    
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        // Only accessible to admins
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }
}
```

## Adding New Exception Handlers

To add a new exception handler, simply add a new method to `GlobalExceptionHandler`:

```java
/**
 * Handle your custom exception
 */
@ExceptionHandler(YourCustomException.class)
public ResponseEntity<ErrorResponse> handleYourCustomException(
        YourCustomException ex,
        HttpServletRequest request) {
    
    log.error("Custom error: {}", ex.getMessage(), ex);
    
    ErrorResponse errorResponse = ErrorResponse.of(
            ex.getMessage(),
            "YOUR_ERROR_CODE",
            HttpStatus.BAD_REQUEST.value(),
            request.getRequestURI()
    );
    
    return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
}
```

## Logging

All exceptions are automatically logged with appropriate levels:
- **ERROR**: Business exceptions, security exceptions, unexpected errors
- Stack traces are included for debugging

Configure logging levels in `application.yml`:

```yaml
logging:
  level:
    com.microservices.common.exception.GlobalExceptionHandler: DEBUG
```

## Auto-Configuration

The `GlobalExceptionHandler` is automatically registered via `spring.factories` and will be active in all services that include the common-lib dependency. No additional configuration needed!

## Testing Exception Handling

```java
@SpringBootTest
@AutoConfigureMockMvc
class ExceptionHandlingTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void testResourceNotFound() throws Exception {
        mockMvc.perform(get("/api/users/999"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("User not found with id: '999'"));
    }
    
    @Test
    void testValidationError() throws Exception {
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"\",\"email\":\"invalid\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.validationErrors.username").exists())
            .andExpect(jsonPath("$.validationErrors.email").exists());
    }
}
```

## Best Practices

1. **Use specific exceptions** - Choose the most appropriate exception for the situation
2. **Provide meaningful messages** - Error messages should help users understand what went wrong
3. **Include error codes** - Use consistent error codes for client-side error handling
4. **Log appropriately** - Don't expose sensitive information in error messages
5. **Don't catch what you can't handle** - Let the GlobalExceptionHandler catch unexpected errors
6. **Extend when needed** - Create new exception types for specific business scenarios

## Phase 2 Complete ✅

Global Exception Handling is now production-ready with:
- ✅ All requested exception types handled
- ✅ Spring Security exceptions (AccessDeniedException, AuthenticationException)
- ✅ HTTP protocol exceptions (method not allowed, media type, etc.)
- ✅ Validation exceptions (both custom and Spring @Valid)
- ✅ Standardized error responses
- ✅ Comprehensive logging
- ✅ Easily extensible for future exceptions
- ✅ Auto-configured for all services
