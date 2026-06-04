# Authentication Service

JWT-based authentication and authorization service for the microservices architecture.

## Overview

The Auth Service handles user authentication and authorization using JWT tokens. It provides user registration, login, token refresh, and will support password reset functionality.

## Features

✅ **User Registration** - Create new user accounts with validation  
✅ **User Login** - Authenticate users and issue JWT tokens  
✅ **JWT Tokens** - Access and refresh token generation  
✅ **Token Refresh** - Refresh expired access tokens  
✅ **Password Encryption** - BCrypt password hashing  
✅ **Role-Based Access** - User roles for authorization  
✅ **Validation** - Uses common-lib validation framework  
✅ **Exception Handling** - Global exception handling via common-lib  
✅ **Database Support** - H2 (dev), PostgreSQL (prod)  
✅ **Service Discovery** - Registered with Eureka  
✅ **Centralized Config** - Configuration from Config Server

## Quick Start

### Prerequisites

1. Discovery Service running (port 8761)
2. Config Server running (port 8888)
3. Database configured (H2 for dev, PostgreSQL for prod)

### Start Auth Service

```bash
cd auth-service
mvn spring-boot:run
```

### Verify Service

- **Health**: http://localhost:8082/actuator/health
- **API**: http://localhost:8082/api/auth/health
- **H2 Console**: http://localhost:8082/h2-console (dev only)

## API Endpoints

### POST /api/auth/register

Register a new user.

**Request**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["USER"]
    }
  }
}
```

**Validation**:
- Username: 3-50 characters, unique
- Email: Valid email format, unique
- Password: Min 8 chars, requires uppercase, lowercase, digit, special char
- Passwords must match

### POST /api/auth/login

Login with username/email and password.

**Request**:
```json
{
  "usernameOrEmail": "johndoe",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["USER"]
    }
  }
}
```

**Error Responses**:
- 401: Invalid credentials
- 401: Account disabled

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["USER"]
    }
  }
}
```

**Error Responses**:
- 401: Invalid or expired refresh token

## JWT Token Structure

### Access Token

- **Expiration**: 15 minutes (dev: 1 hour)
- **Claims**:
  - `userId`: User ID
  - `username`: Username
  - `roles`: User roles array
  - `tokenType`: "ACCESS"

### Refresh Token

- **Expiration**: 7 days (dev: 30 days)
- **Claims**:
  - `userId`: User ID
  - `tokenType`: "REFRESH"

### Using Access Token

Include in Authorization header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Schema

### User Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT |
| username | VARCHAR(50) | NOT NULL, UNIQUE |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| password | VARCHAR(100) | NOT NULL (BCrypt) |
| first_name | VARCHAR(100) | |
| last_name | VARCHAR(100) | |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' |
| enabled | BOOLEAN | NOT NULL, DEFAULT TRUE |
| account_non_expired | BOOLEAN | NOT NULL, DEFAULT TRUE |
| account_non_locked | BOOLEAN | NOT NULL, DEFAULT TRUE |
| credentials_non_expired | BOOLEAN | NOT NULL, DEFAULT TRUE |
| refresh_token | VARCHAR(500) | |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |
| last_login_at | TIMESTAMP | |

### User Roles Table

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | BIGINT | FOREIGN KEY → users(id) |
| role | VARCHAR(50) | NOT NULL |

**Default Roles**:
- `USER` - Standard user (default)
- `ADMIN` - Administrator
- `MODERATOR` - Moderator

## Configuration

### Development (H2 Database)

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:authdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
  h2:
    console:
      enabled: true
```

### Production (PostgreSQL)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/authdb_prod
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
```

## Testing with cURL

### Register User

```bash
curl -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login

```bash
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser",
    "password": "Test123!@#"
  }'
```

### Refresh Token

```bash
curl -X POST http://localhost:8082/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

### Via API Gateway

```bash
# Register via gateway
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ ... }'

# Login via gateway
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

## Common-Lib Integration

Auth Service leverages common-lib extensively:

### JWT Utilities
```java
@Autowired
private JwtUtil jwtUtil;

// Generate tokens
String accessToken = jwtUtil.generateAccessToken(username, userId, roles);
String refreshToken = jwtUtil.generateRefreshToken(username, userId);

// Validate tokens
boolean isValid = jwtUtil.validateToken(token, username);
String username = jwtUtil.extractUsername(token);
```

### Password Encoding
```java
// Encode password
String encoded = PasswordUtil.encode(rawPassword);

// Verify password
boolean matches = PasswordUtil.matches(rawPassword, encodedPassword);
```

### Validation
```java
// Using @Valid with common-lib validators
@PostMapping("/register")
public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
    // RegisterRequest uses @ValidPassword, @Email, @FieldMatch
}
```

### Exception Handling
```java
// Throw exceptions - automatically handled by GlobalExceptionHandler
throw new BusinessException("Username already exists", "USERNAME_EXISTS", HttpStatus.CONFLICT);
throw new UnauthorizedException("Invalid credentials");
throw new ValidationException(validationErrors);
```

## Error Responses

All errors follow common-lib format:

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "statusCode": 400,
  "validationErrors": {
    "password": "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character",
    "confirmPassword": "Passwords do not match"
  }
}
```

### Business Error (409)
```json
{
  "success": false,
  "message": "Username already exists",
  "errorCode": "USERNAME_EXISTS",
  "statusCode": 409
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid username/email or password",
  "errorCode": "UNAUTHORIZED",
  "statusCode": 401
}
```

## Security Features

✅ **BCrypt Password Hashing** - Secure password storage  
✅ **JWT Tokens** - Stateless authentication  
✅ **Token Expiration** - Configurable token lifetimes  
✅ **Refresh Tokens** - Long-lived tokens for re-authentication  
✅ **Input Validation** - Comprehensive request validation  
✅ **SQL Injection Prevention** - JPA/Hibernate protections  
✅ **CSRF Disabled** - Stateless API (JWT-based)

## Future Enhancements

- 🔜 **Password Reset** - Email-based password recovery
- 🔜 **Email Verification** - Verify user email addresses
- 🔜 **OAuth2 Integration** - Social login (Google, GitHub)
- 🔜 **Two-Factor Authentication** - TOTP-based 2FA
- 🔜 **Account Lockout** - Failed login attempt protection
- 🔜 **Password History** - Prevent password reuse
- 🔜 **Session Management** - Track active sessions
- 🔜 **Audit Logging** - Track authentication events

## Port Reference

- **8761**: Discovery Service
- **8888**: Config Server
- **8080**: API Gateway
- **8082**: **Auth Service** ← You are here
- **8081**: User Service (next)
- **8083**: Notification Service (next)

## Startup Order

```
1. Discovery Service (8761)
   ↓
2. Config Server (8888)
   ↓
3. API Gateway (8080)
   ↓
4. Auth Service (8082)  ← Start this
```

---

**Status**: ✅ Production Ready  
**API**: http://localhost:8082/api/auth  
**Via Gateway**: http://localhost:8080/api/auth
