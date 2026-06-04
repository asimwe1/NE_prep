# Common Library

Shared library for all microservices in the system.

## Overview

This library provides common functionality that is used across all microservices, including:
- Response wrappers (ApiResponse, ErrorResponse)
- Common exceptions with global exception handler
- Security utilities (JWT, Password encoding)
- Base event classes for messaging
- DTOs and constants
- Utility classes

## Usage

### 1. Add as Maven Dependency

In your service's `pom.xml`:

```xml
<dependency>
    <groupId>com.microservices</groupId>
    <artifactId>common-lib</artifactId>
    <version>1.0.0</version>
</dependency>
```

### 2. Enable Component Scanning

Add this to your main application class:

```java
@SpringBootApplication
@ComponentScan(basePackages = {"com.microservices"})
public class YourServiceApplication {
    // ...
}
```


## Components

### Response Wrappers

**ApiResponse<T>** - Standard response wrapper for successful operations:
```java
return ResponseEntity.ok(ApiResponse.success(userData, "User retrieved successfully"));
```

**ErrorResponse** - Detailed error response with validation support:
```java
// Automatically handled by GlobalExceptionHandler
throw new ResourceNotFoundException("User", "id", userId);
```

### Exceptions

All exceptions extend `BusinessException`:
- `ResourceNotFoundException` - 404 errors
- `UnauthorizedException` - 401 errors
- `ForbiddenException` - 403 errors
- `ValidationException` - 400 validation errors

The `GlobalExceptionHandler` automatically converts these to appropriate HTTP responses.

### Security Utilities

**JwtUtil** - JWT token generation and validation:
```java
@Autowired
private JwtUtil jwtUtil;

String accessToken = jwtUtil.generateAccessToken(username, userId, roles);
String username = jwtUtil.extractUsername(token);
boolean isValid = jwtUtil.validateToken(token, username);
```


**PasswordUtil** - Password encoding:
```java
String encoded = PasswordUtil.encode("password123");
boolean matches = PasswordUtil.matches("password123", encoded);
```

### Events

**BaseEvent** - Base class for all messaging events:
```java
@Data
@SuperBuilder
public class UserCreatedEvent extends BaseEvent {
    private Long userId;
    private String email;
}
```

### DTOs

**PageResponse<T>** - Paginated response wrapper:
```java
Page<User> userPage = userRepository.findAll(pageable);
return ResponseEntity.ok(PageResponse.from(userPage));
```

### Constants

- `CommonConstants` - General constants (headers, formats, status codes)
- `SecurityConstants` - Security-related constants (JWT, roles, claims)

## Building

```bash
cd common-lib
mvn clean install
```

This installs the library to your local Maven repository for use by other services.
