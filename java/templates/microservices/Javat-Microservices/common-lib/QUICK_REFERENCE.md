# Common Library - Quick Reference

## Exception Throwing Cheat Sheet

```java
// 404 - Resource not found
throw new ResourceNotFoundException("User", "id", userId);
throw new ResourceNotFoundException("User not found");

// 401 - Unauthorized (authentication failed)
throw new UnauthorizedException("Invalid credentials");
throw new UnauthorizedException("Token expired");

// 403 - Forbidden (no permission)
throw new ForbiddenException("You don't have permission to delete this resource");

// 400 - Business logic error
throw new BusinessException("Cannot complete order - insufficient stock");
throw new BusinessException("User already exists", "USER_EXISTS", HttpStatus.CONFLICT);

// 400 - Validation error with field details
Map<String, String> errors = new HashMap<>();
errors.put("email", "Invalid email format");
errors.put("password", "Password too weak");
throw new ValidationException("Validation failed", errors);
```

## Response Wrappers

```java
// Success with data
return ResponseEntity.ok(ApiResponse.success(userData));

// Success with data and message
return ResponseEntity.ok(ApiResponse.success(userData, "User created successfully"));

// Success with only message
return ResponseEntity.ok(ApiResponse.success("Operation completed"));

// Created (201)
return ResponseEntity.status(HttpStatus.CREATED)
    .body(ApiResponse.success(newUser, "User created"));

// No content (204)
return ResponseEntity.noContent().build();

// Paginated response
Page<User> page = userRepository.findAll(pageable);
return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
```

## Security Utils

```java
// JWT Generation
@Autowired
private JwtUtil jwtUtil;

String accessToken = jwtUtil.generateAccessToken(username, userId, roles);
String refreshToken = jwtUtil.generateRefreshToken(username, userId);

// JWT Validation & Extraction
String username = jwtUtil.extractUsername(token);
Long userId = jwtUtil.extractUserId(token);
List<String> roles = jwtUtil.extractRoles(token);
boolean isValid = jwtUtil.validateToken(token, username);
boolean isExpired = jwtUtil.isTokenExpired(token);

// Password Encoding
String encodedPassword = PasswordUtil.encode("password123");
boolean matches = PasswordUtil.matches("password123", encodedPassword);
```

## Validation Annotations

```java
@Data
public class UserRequest {
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50)
    private String username;
    
    @NotBlank
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank
    @Size(min = 8, max = 100)
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).*$", 
             message = "Password must contain uppercase, lowercase and digit")
    private String password;
    
    @NotNull
    @Min(18)
    @Max(120)
    private Integer age;
    
    @Past(message = "Birth date must be in the past")
    private LocalDate birthDate;
    
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number")
    private String phoneNumber;
}
```

## Controller Example

```java
@RestController
@RequestMapping("/api/users")
@Slf4j
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> getUser(@PathVariable Long id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<UserDTO>> createUser(
            @Valid @RequestBody CreateUserRequest request) {
        UserDTO user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(user, "User created successfully"));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserDTO user = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(user, "User updated successfully"));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserDTO>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<UserDTO> userPage = userService.getAllUsers(pageable);
        
        return ResponseEntity.ok(
            ApiResponse.success(PageResponse.from(userPage))
        );
    }
}
```

## Service Example

```java
@Service
@Slf4j
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToDTO(user);
    }
    
    public UserDTO createUser(CreateUserRequest request) {
        // Check if user exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("User with this email already exists", 
                "USER_EXISTS", HttpStatus.CONFLICT);
        }
        
        // Create user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(PasswordUtil.encode(request.getPassword()));
        
        User savedUser = userRepository.save(user);
        log.info("User created: {}", savedUser.getId());
        
        return mapToDTO(savedUser);
    }
    
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
            
        userRepository.delete(user);
        log.info("User deleted: {}", id);
    }
}
```

## Event Publishing Example

```java
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreatedEvent extends BaseEvent {
    private Long userId;
    private String email;
    private String username;
}

@Service
public class UserEventPublisher {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void publishUserCreated(User user) {
        UserCreatedEvent event = UserCreatedEvent.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .build();
            
        event.initialize("USER_CREATED", "user-service");
        
        rabbitTemplate.convertAndSend("user.exchange", "user.created", event);
    }
}
```

## Constants Usage

```java
// Security constants
SecurityConstants.JWT_ACCESS_TOKEN_VALIDITY  // 15 minutes
SecurityConstants.JWT_REFRESH_TOKEN_VALIDITY // 7 days
SecurityConstants.CLAIM_USER_ID
SecurityConstants.CLAIM_ROLES
SecurityConstants.ROLE_ADMIN
SecurityConstants.ROLE_USER

// Common constants
CommonConstants.AUTHORIZATION_HEADER         // "Authorization"
CommonConstants.BEARER_PREFIX                // "Bearer "
CommonConstants.CORRELATION_ID_HEADER        // "X-Correlation-ID"
CommonConstants.DEFAULT_PAGE_SIZE            // 20
CommonConstants.MAX_PAGE_SIZE                // 100
CommonConstants.STATUS_ACTIVE
CommonConstants.SUCCESS_MESSAGE
CommonConstants.CREATED_MESSAGE
```

## Utility Classes

```java
// String utilities
StringUtil.isBlank(str)
StringUtil.isNotBlank(str)
StringUtil.isValidEmail(email)
StringUtil.capitalize(str)
StringUtil.trim(str)

// Date/Time utilities
DateTimeUtil.formatDate(LocalDate.now())
DateTimeUtil.formatDateTime(LocalDateTime.now())
DateTimeUtil.parseDate("2026-06-04")
DateTimeUtil.getCurrentDate()
DateTimeUtil.daysBetween(startDate, endDate)
DateTimeUtil.isPast(date)
DateTimeUtil.isFuture(date)
```

## Configuration in application.yml

```yaml
# JWT Configuration
jwt:
  secret: your-secret-key-at-least-256-bits
  access-token:
    expiration: 900000      # 15 minutes
  refresh-token:
    expiration: 604800000   # 7 days

# Enable exception handling for 404
spring:
  mvc:
    throw-exception-if-no-handler-found: true
  web:
    resources:
      add-mappings: false

# Logging
logging:
  level:
    com.microservices.common: INFO
```


## Custom Validation Annotations

### @ValidPassword
```java
@ValidPassword  // Default: min 8 chars, uppercase, lowercase, digit, special char
private String password;

// Custom requirements
@ValidPassword(minLength = 10, requireSpecialChar = false)
private String password;
```

### @ValidEnum
```java
@ValidEnum(enumClass = UserStatus.class)
private String status;

@ValidEnum(enumClass = UserStatus.class, ignoreCase = true)
private String status;
```

### @ValidPhoneNumber
```java
@ValidPhoneNumber  // E.164 format: +1234567890
private String phoneNumber;
```

### @FieldMatch (Class-level)
```java
@Data
@FieldMatch(first = "password", second = "confirmPassword")
public class RegisterRequest {
    @ValidPassword
    private String password;
    private String confirmPassword;
}
```

### @ValidDateRange (Class-level)
```java
@Data
@ValidDateRange(start = "startDate", end = "endDate")
public class BookingRequest {
    @NotNull
    private LocalDate startDate;
    @NotNull
    private LocalDate endDate;
}
```

## Validation Groups

```java
// Define in DTO
@Null(groups = ValidationGroups.Create.class)
@NotNull(groups = ValidationGroups.Update.class)
private Long id;

// Use in controller
@PostMapping
public ResponseEntity<?> create(
    @Validated(ValidationGroups.Create.class) @RequestBody UserDTO dto) {
    // ...
}

@PutMapping("/{id}")
public ResponseEntity<?> update(
    @Validated(ValidationGroups.Update.class) @RequestBody UserDTO dto) {
    // ...
}
```

## Programmatic Validation

```java
@Autowired
private Validator validator;

// Validate and throw exception
ValidationUtil.validate(request, validator);

// Validate with groups
ValidationUtil.validate(request, validator, ValidationGroups.Create.class);

// Get errors without exception
Map<String, String> errors = ValidationUtil.getValidationErrors(request, validator);

// Check if valid
boolean isValid = ValidationUtil.isValid(request, validator);
```

## Validation Error Response

Automatic validation errors return:
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "statusCode": 400,
  "validationErrors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters...",
    "phoneNumber": "Invalid phone number format..."
  }
}
```
