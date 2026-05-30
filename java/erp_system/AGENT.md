# AGENTS.md

---

## Purpose

This file defines the engineering standards, architecture rules, documentation rules, and
development workflow for all Java backend applications.

These rules are framework-agnostic but optimized for:

- Java
- Spring Boot
- Spring Data JPA
- Spring Security
- JWT
- Maven / Gradle
- REST APIs
- Swagger / OpenAPI

This document must be followed for every backend project regardless of domain.

The goal is to build:

- scalable systems
- modular architectures
- maintainable codebases
- secure APIs
- production-quality backend services

---

## Engineering Philosophy

Write code like a senior backend engineer working on a long-term enterprise product.

Prioritize:

1. Readability
2. Modularity
3. Maintainability
4. Scalability
5. Testability
6. Documentation
7. Consistency

Avoid:

- Giant files
- God classes
- Duplicated logic
- Controller-heavy logic
- Hidden side effects
- Weak naming
- Undocumented APIs
- Hardcoded business rules

---

## Agent Behavior Rules

### Before Any Action

1. Read `AGENTS.md` fully
2. Confirm the applicable rules mentally
3. Plan the work — identify modules, entities, DTOs, flows, security concerns
4. Then implement

### Before Coding a Feature

1. Explain the architecture
2. List all classes/files that will be created or modified
3. Explain the request/response flow
4. Explain the validation strategy
5. Explain the security strategy

### While Building

- Think modularly — one responsibility per class
- Keep files small (prefer under 60 lines, hard max 120 lines)
- Write JavaDoc comments for all public methods
- Comment complex business logic inline
- Avoid over-commenting obvious code
- Preserve consistency with the existing codebase
- Prefer composition over complexity

### After Implementing

1. Test the feature
2. Document all endpoints in Swagger
3. Add request/response examples
4. Validate security and authorization
5. Summarize changes made

### Never

- Start coding before reading `AGENTS.md`
- Dump all logic into one class
- Create giant utility files
- Tightly couple modules
- Skip documentation
- Skip validation
- Skip security

---

## Core Architecture Rules

Use layered architecture:

```
Controller
→ Service
→ Repository
→ Database
```

Optional facade layer for complex orchestration:

```
Controller
→ Facade
→ Service
→ Repository
→ Database
```

Dependency direction is strict.

Lower layers must **never** depend on higher layers.

Forbidden:

- Repositories importing services
- Services importing controllers
- Utilities importing domain logic
- Circular dependencies

---

## Package Structure

Use modular, feature-based architecture.

```
src/main/java/com/app/

  common/
    config/
    security/
    exception/
    response/
    validation/
    constants/
    utils/

  modules/
    auth/
    users/
    payments/
    notifications/
    reports/
```

Each module contains:

```
module/
  controller/
  service/
  repository/
  entity/
  dto/
  mapper/
  validation/
  docs/
```

Avoid:

- Giant shared folders
- Dumping everything into `utils/`
- Type-based architecture only (`controllers/`, `services/`, `repositories/` at root)

Prefer:

- Feature grouping
- Cohesive, self-contained modules

---

## File Rules

- **Preferred:** under 60 lines
- **Hard maximum:** 120 lines

If exceeded:

- Split immediately
- Extract responsibility
- Create a helper, service, mapper, or validator

Never create:

- 500-line services
- Giant controllers
- Giant entities
- Giant utility classes

---

## Function Rules

Every method must:

- Do one thing only
- Have a clear, intent-revealing name
- Be predictable and side-effect-free where possible
- Remain independently testable

Limits:

- **Preferred:** under 20 lines
- **Maximum:** 30 lines
- **Maximum nesting depth:** 3

Use:

- Early returns to reduce nesting
- Extracted private methods for sub-steps
- Isolated side effects at the boundary

Avoid:

- Deeply nested conditionals
- Giant orchestration methods
- Hidden mutations

---

## Naming Rules

Names must explain intent without requiring a comment.

| Category  | Convention       | Good Example           | Bad Example    |
|-----------|------------------|------------------------|----------------|
| Classes   | PascalCase       | `InvoiceService`       | `Helper`       |
| Methods   | camelCase        | `calculateTax`         | `processStuff` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`      | `val`          |
| Packages  | lowercase        | `com.app.modules.auth` | `Com.App.Auth` |

More good examples:

- `createUser`, `generateInvoice`, `validateToken`, `findEmployeeByCode`

More bad examples:

- `data`, `temp`, `object`, `utilMethod`, `doWork`

---

## Controller Rules

Controllers must:

- Receive HTTP requests
- Validate the request flow (using `@Valid`)
- Delegate all logic to services
- Return consistent API responses

Controllers must **not**:

- Contain business logic
- Calculate values
- Query the database directly
- Contain long processing flows

Controllers should stay lightweight — 20–30 lines per method maximum.

---

## Service Rules

Services contain:

- Business logic
- Orchestration between repositories
- Domain validations
- Workflow steps

Services must:

- Remain modular and focused
- Be independently testable
- Avoid framework-heavy coupling where possible

Services must **not**:

- Handle HTTP concerns
- Return `ResponseEntity` directly
- Manipulate servlet objects

---

## Repository Rules

Repositories:

- Access the database only
- Contain query logic only (JPQL, native queries, derived methods)

Repositories must **not**:

- Contain business logic
- Calculate domain rules
- Send notifications
- Contain workflow orchestration

---

## DTO Rules

Never expose entities directly in API responses.

Always use:

- **Request DTOs** — for incoming data (with validation annotations)
- **Response DTOs** — for outgoing data (clean, formatted)

Separate concerns:

- Input validation → Request DTO
- Response formatting → Response DTO
- Persistence → Entity

Never return:

- Passwords or hashed passwords
- Internal secrets or tokens
- Unnecessary nested relationships

---

## Validation Rules

Validate **all** external input.

Use:

- `@Valid` on controller parameters
- `@NotBlank`, `@NotNull`, `@Email`, `@Pattern`, `@Positive`, `@Min`, `@Max` on DTO fields

Never trust:

- Frontend validation
- API consumer contracts
- External integrations

Validation must exist at:

- DTO level (input format)
- Service level (business rules)

---

## Security Rules

Security is **mandatory** — not optional.

Always:

- Hash passwords with BCrypt
- Use JWT securely (short expiry, signed)
- Protect all endpoints with proper authorization
- Validate authorization at the service layer
- Sanitize all inputs
- Store secrets in environment variables
- Configure CORS explicitly

Never:

- Hardcode secrets or credentials
- Expose stack traces in API responses
- Log tokens, passwords, or sensitive data

Use:

- `BCryptPasswordEncoder`
- Spring Security filter chains
- Role-based access control (`@PreAuthorize`, `@Secured`)

---

## Authentication Rules

Use:

- JWT for stateless authentication
- Refresh tokens where session longevity is required
- Role-based authorization enforced at the method or endpoint level

Authentication logic must be isolated in:

- `common/security/`
- `modules/auth/`

Never spread authentication logic randomly across unrelated modules.

---

## API Design Rules

Use RESTful conventions consistently.

```
GET     /api/users              → list users (paginated)
GET     /api/users/{id}         → get single user
POST    /api/users              → create user
PUT     /api/users/{id}         → full update
PATCH   /api/users/{id}/status  → partial update
DELETE  /api/users/{id}         → delete user
```

Avoid:

- Action-heavy names (`/api/doCreateUser`, `/api/runReport`)
- Inconsistent pluralization
- Mixing snake_case and camelCase in URLs

---

## API Response Rules

Use a consistent response envelope for all endpoints.

**Success:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

**Paginated:**

```json
{
  "success": true,
  "message": "Records fetched successfully",
  "data": [],
  "meta": {
    "page": 0,
    "size": 10,
    "totalElements": 100,
    "totalPages": 10
  }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

## Swagger / OpenAPI Rules

**All APIs must be documented.**

Every endpoint must include:

- Summary and description
- Request body example
- Success response example
- Validation error example
- Authentication requirements
- All relevant HTTP status codes

Organize by module tag:

```
Authentication
Users
Payments
Reports
Notifications
```

Do **not** place all endpoints under a single tag.

### Example Annotations Pattern

```java
@Operation(summary = "Create user", description = "Registers a new user account")
@ApiResponses({
  @ApiResponse(responseCode = "201", description = "User created"),
  @ApiResponse(responseCode = "400", description = "Validation failed"),
  @ApiResponse(responseCode = "409", description = "Email already exists")
})
```

Request example:

```json
{ "firstName": "John", "lastName": "Doe", "email": "john@example.com" }
```

Success response example:

```json
{ "success": true, "message": "User created successfully", "data": { "id": 1 } }
```

Error response example:

```json
{ "success": false, "message": "Email already exists", "errors": [] }
```

---

## Exception Handling Rules

Use a **global exception handler** (`@RestControllerAdvice`).

Implement handlers for:

- Validation exceptions (`MethodArgumentNotValidException`)
- Resource not found (`ResourceNotFoundException`)
- Duplicate resource (`DuplicateResourceException`)
- Authentication failure (`AuthenticationException`)
- Authorization failure (`AccessDeniedException`)
- Business rule violations (`BusinessException`)

Never expose:

- Stack traces in responses
- Raw SQL error messages
- Internal framework details

---

## Mapper Rules

Use mappers for all DTO ↔ Entity conversion.

- Prefer **MapStruct** for compile-time safety and performance
- Fall back to dedicated mapper classes when MapStruct is unavailable

Never:

- Manually duplicate mapping logic inline across multiple methods
- Map inside controllers or repositories

---

## Database Rules

- Use proper entity relationships and foreign keys
- Define indexes on frequently queried columns
- Use database migrations (Flyway or Liquibase)
- Add unique constraints on critical fields (e.g., email)

Prevent:

- Duplicate critical records
- Inconsistent state from partial writes
- Orphaned records from missing cascade rules

Prefer:

- Normalized schemas
- Explicit named constraints

---

## Logging Rules

Log:

- Authentication events (login, logout, failed attempts)
- Important business actions (payment processed, user created)
- All errors and unexpected failures
- External integration calls and responses

Never log:

- Passwords or hashed passwords
- JWT tokens or refresh tokens
- Sensitive personal data (SSN, card numbers)

Use structured logging (`SLF4J` + `Logback`) with consistent log levels:

- `INFO` — normal business events
- `WARN` — recoverable issues
- `ERROR` — failures requiring attention

---

## Testing Rules

Write tests for:

- All service methods with business logic
- Security and authorization rules
- Input validation behavior
- Critical integrations

Prioritize:

- **Unit tests** — services, validators, mappers
- **Integration tests** — full request/response flows

Avoid:

- Fragile tests tied to implementation details
- Untested critical paths

Critical business logic must **always** be tested before merging.

---

## Performance Rules

Avoid:

- N+1 queries (use `JOIN FETCH` or `@EntityGraph`)
- Unnecessary eager loading of large associations
- Duplicated database calls in the same request
- Blocking operations on the main thread

Use:

- Pagination for all list endpoints
- Database indexes on filter/sort columns
- Query optimization with `EXPLAIN` analysis
- Caching (`@Cacheable`) where appropriate

---

## Documentation Rules

Every module must include a `docs/` folder or README containing:

- Module purpose
- Architecture notes
- Important workflows and business rules
- Sequence explanations for complex flows

Public APIs must be understandable without reading implementation code.

---

## Git Rules

Commit after **meaningful, working progress** only.

Before each commit:

- All tests pass
- Application starts without errors
- Swagger loads correctly
- Critical endpoints respond correctly

Commit message prefixes:

| Prefix       | Use for                              |
|--------------|--------------------------------------|
| `feat:`      | New features                         |
| `fix:`       | Bug fixes                            |
| `refactor:`  | Code improvements without behavior change |
| `docs:`      | Documentation updates                |
| `test:`      | Adding or updating tests             |
| `chore:`     | Build config, dependencies, tooling  |

Never commit broken builds.

---

## Development Workflow

### Before Coding

1. Understand and clarify requirements
2. Design the architecture and data model
3. Identify all modules involved
4. Identify entities and relationships
5. Identify all DTOs (request + response)
6. Identify business rules and edge cases
7. Identify security and authorization requirements
8. Identify documentation and Swagger requirements

### Before Implementing a Feature

1. Explain the planned architecture in a summary
2. List all classes and files to be created or modified
3. Explain the full request/response flow
4. Explain the validation strategy
5. Explain the security strategy

### After Implementing a Feature

1. Run all tests — unit and integration
2. Document all new endpoints in Swagger with examples
3. Validate all security rules are enforced
4. Summarize all changes made

---

## Final Rule

Build backend systems that are easy to scale, easy to maintain, easy to document,
and easy for future developers to understand.

When in doubt: **keep it simple, keep it modular, keep it documented.**