# Phase 1 - Common Library Setup

## What's Included

### ✅ Core Components

1. **Response Wrappers**
   - `ApiResponse<T>` - Generic success response wrapper
   - `ErrorResponse` - Detailed error response with validation support
   - `PageResponse<T>` - Paginated response wrapper

2. **Exception Handling**
   - `BusinessException` - Base exception class
   - `ResourceNotFoundException` - 404 errors
   - `UnauthorizedException` - 401 errors
   - `ForbiddenException` - 403 errors
   - `ValidationException` - 400 validation errors
   - `GlobalExceptionHandler` - Centralized exception handling (@RestControllerAdvice)

3. **Security Utilities**
   - `JwtUtil` - JWT token generation and validation (access & refresh tokens)
   - `PasswordUtil` - BCrypt password encoding/verification
   - `SecurityConstants` - Security-related constants (roles, claims, JWT config)

4. **Events**
   - `BaseEvent` - Base class for RabbitMQ messaging events

5. **DTOs**
   - `PageResponse<T>` - Pagination wrapper

6. **Constants**
   - `CommonConstants` - HTTP headers, formats, pagination defaults
   - `SecurityConstants` - JWT claims, roles, token types

7. **Utility Classes**
   - `StringUtil` - String operations (validation, formatting)
   - `DateTimeUtil` - Date/time operations and formatting

## Project Structure

```
common-lib/
├── src/main/java/com/microservices/common/
│   ├── response/
│   │   ├── ApiResponse.java
│   │   └── ErrorResponse.java
│   ├── exception/
│   │   ├── BusinessException.java
│   │   ├── ResourceNotFoundException.java
│   │   ├── UnauthorizedException.java
│   │   ├── ForbiddenException.java
│   │   ├── ValidationException.java
│   │   └── GlobalExceptionHandler.java
│   ├── security/
│   │   ├── JwtUtil.java
│   │   └── PasswordUtil.java
│   ├── event/
│   │   └── BaseEvent.java
│   ├── dto/
│   │   └── PageResponse.java
│   ├── constants/
│   │   ├── CommonConstants.java
│   │   └── SecurityConstants.java
│   └── util/
│       ├── StringUtil.java
│       └── DateTimeUtil.java
├── src/main/resources/
│   ├── application.yml
│   └── META-INF/
│       └── spring.factories (Auto-configuration)
├── pom.xml
└── README.md
```

## Dependencies Included

- Spring Boot Web Starter
- Spring Boot Validation
- Spring Security
- JWT (jjwt 0.12.3)
- Lombok
- Jackson (JSON)
- Apache Commons Lang3

## Next Steps

### 1. Build and Install

```bash
cd common-lib
mvn clean install
```

This will install the library to your local Maven repository (~/.m2/repository).

### 2. Use in Other Services

Add to your service's `pom.xml`:

```xml
<dependency>
    <groupId>com.microservices</groupId>
    <artifactId>common-lib</artifactId>
    <version>1.0.0</version>
</dependency>
```

### 3. Configure JWT Secret

In your service's `application.yml`, override the default JWT secret:

```yaml
jwt:
  secret: your-super-secret-key-here-must-be-at-least-256-bits
  access-token:
    expiration: 900000 # 15 minutes
  refresh-token:
    expiration: 604800000 # 7 days
```

### 4. Enable Component Scanning

The library uses Spring's auto-configuration, but ensure your main application class includes the base package:

```java
@SpringBootApplication
@ComponentScan(basePackages = {"com.microservices"})
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

## Auto-Configuration

The library automatically configures:
- `GlobalExceptionHandler` - Catches and formats all exceptions
- `JwtUtil` - Available as a Spring bean for injection

## Initialization Complete ✅

**Yes, Spring Boot initialization was needed!** Here's what we did:

1. ✅ Created `pom.xml` with Spring Boot parent
2. ✅ Added all necessary dependencies (Web, Security, Validation, JWT)
3. ✅ Created `spring.factories` for auto-configuration
4. ✅ Added `application.yml` with default configuration
5. ✅ Made components injectable (`@Component`, `@RestControllerAdvice`)
6. ✅ Set up as a library (not a standalone app - no @SpringBootApplication)

The common-lib is now ready to be used by all your microservices!

## What Makes This a Library (Not a Service)

- ❌ No `@SpringBootApplication` class (not runnable)
- ❌ No `main()` method
- ✅ Uses `spring.factories` for auto-configuration
- ✅ Other services can import it as a Maven dependency
- ✅ All components are auto-discovered when imported

## Ready for Phase 2! 🚀

Your common library is complete and ready. When you move to Phase 2, other services like:
- `user-service`
- `auth-service`
- `notification-service`

Can simply add this library as a dependency and immediately benefit from:
- Consistent response formats
- Centralized exception handling
- JWT utilities
- Validation framework
- Security utilities
