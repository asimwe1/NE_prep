# Utility Billing System Codebase Guide

## 1. What this codebase is

This project is a Spring Boot backend for a utility billing system.

Main technology choices:

- `Spring Boot` for application bootstrap and REST API development
- `Spring Security` for authentication and authorization
- `JWT` for stateless access control
- `Spring Data JPA` for persistence
- `PostgreSQL` as the main database
- `Bean Validation` for request validation
- `Springdoc OpenAPI` for Swagger documentation
- `Thymeleaf + Mail` for email templates and notification delivery

The codebase is organized in a standard layered architecture:

- controller layer
- service layer
- repository layer
- entity layer
- DTO layer
- configuration/security/support packages

This structure is useful because it separates:

- HTTP/API concerns
- business rules
- database access
- security logic
- validation and error handling

## 2. High-level package structure

Under `src/main/java/com/template`:

- `config`
- `controller`
- `dto`
- `entity`
- `exception`
- `repository`
- `security`
- `service`
- `util`
- `validation`

### `config`

Contains application wiring:

- `ApplicationConfig.java`
- `SecurityConfig.java`
- `OpenApiConfig.java`

Purpose:

- register beans
- configure authentication
- configure HTTP security
- configure Swagger/OpenAPI

### `controller`

Contains REST endpoints.

Each controller exposes one business area:

- `AuthController`
- `AdminUserController`
- `CustomerController`
- `MeterController`
- `MeterReadingController`
- `TariffController`
- `BillController`
- `PaymentController`
- `NotificationController`

Why this is useful:

- endpoints stay grouped by business capability
- permissions are visible close to the API methods
- Swagger documentation can be attached directly to each endpoint

### `dto`

Contains request and response classes.

Examples:

- `LoginRequest`
- `MeterReadingRequest`
- `TariffRequest`
- `BillResponse`

Why DTOs were used:

- avoid exposing JPA entities directly over the API
- validate input cleanly
- shape responses in a stable format
- decouple database models from API contracts

### `entity`

Contains JPA domain models.

Examples:

- `User`
- `Customer`
- `UtilityMeter`
- `MeterReading`
- `Bill`
- `Payment`
- `Tariff`
- `TaxConfiguration`
- `PenaltyConfiguration`
- `CustomerNotification`
- `RefreshToken`

These are the persistence models mapped to database tables.

### `repository`

Contains Spring Data JPA repositories.

Examples:

- `UserRepository`
- `CustomerRepository`
- `UtilityMeterRepository`
- `MeterReadingRepository`
- `BillRepository`

Why repositories were used:

- reduce boilerplate SQL
- use method naming conventions for common lookups
- keep persistence logic separate from business logic

### `service`

Contains the business rules.

Examples:

- `AuthService`
- `CustomerService`
- `MeterService`
- `MeterReadingService`
- `TariffService`
- `BillService`
- `PaymentService`
- `NotificationService`

This is the most important layer in the project because it contains the actual system behavior.

### `security`

Contains JWT and request authentication pieces:

- `JwtService`
- `JwtAuthenticationFilter`

### `exception`

Contains:

- domain-specific exceptions
- the global exception handler

This gives the API consistent error responses.

### `util`

Contains helper startup logic:

- `DataInitializer`

### `validation`

Contains custom validation annotations and validators for:

- names
- Rwandan phone numbers
- national IDs

This keeps validation rules reusable and close to the domain.

## 3. Application startup flow

Main entry file:

- [UtilityBillingApplication.java](/mnt/data/landry/academics/rca/NE_prep/java/exam/official/utility-billing-system/src/main/java/com/template/UtilityBillingApplication.java)

What it does:

1. loads `.env` values with `dotenv-java`
2. pushes them into system properties
3. starts the Spring Boot application
4. enables async execution
5. enables scheduling

Why this approach was used:

- it supports simple local `.env`-based configuration
- it keeps configuration flexible across local, Docker, and production-style runs

## 4. Security design

### Authentication model

The system uses:

- email + password login
- JWT access token
- refresh token persistence in database

Relevant files:

- [ApplicationConfig.java](/mnt/data/landry/academics/rca/NE_prep/java/exam/official/utility-billing-system/src/main/java/com/template/config/ApplicationConfig.java)
- [SecurityConfig.java](/mnt/data/landry/academics/rca/NE_prep/java/exam/official/utility-billing-system/src/main/java/com/template/config/SecurityConfig.java)
- [JwtService.java](/mnt/data/landry/academics/rca/NE_prep/java/exam/official/utility-billing-system/src/main/java/com/template/security/JwtService.java)
- [JwtAuthenticationFilter.java](/mnt/data/landry/academics/rca/NE_prep/java/exam/official/utility-billing-system/src/main/java/com/template/security/JwtAuthenticationFilter.java)
- [RefreshTokenService.java](/mnt/data/landry/academics/rca/NE_prep/java/exam/official/utility-billing-system/src/main/java/com/template/service/RefreshTokenService.java)

### Why JWT was used

JWT is a good fit here because:

- the backend is a REST API
- the app is stateless for normal requests
- Swagger/Postman testing becomes easy
- frontend clients can pass bearer tokens directly

### Why refresh tokens are stored in DB

Access tokens are short-lived and stateless.

Refresh tokens are stored because:

- they can be invalidated
- logout can remove them
- expired ones can be rejected and deleted

### Why `tokenVersion` exists in JWT claims

`JwtService` includes `tokenVersion` in the token.

Why:

- changing password or logging out can invalidate previously issued access tokens
- user token state can be controlled without storing every access token

This is a pragmatic compromise between full statelessness and revocation support.

### Authorization model

Two levels are used:

1. request-level security in `SecurityConfig`
2. method-level role checks using `@PreAuthorize`

Why both are useful:

- `SecurityConfig` defines the public/private boundary
- `@PreAuthorize` expresses business permissions directly at controller methods

## 5. Domain model design

### `User`

Represents login identity.

Important fields:

- email
- password
- role
- status
- verification token
- password reset token
- token version

Why this entity exists separately:

- authentication concerns differ from billing/business concerns

### `Customer`

Represents the business/customer profile.

Important fields:

- customer number
- national ID
- address
- district
- active/inactive status
- optional linked `User`

Why separate `Customer` from `User`:

- some systems need customer business records independent from login identity
- a customer profile can be linked to a `ROLE_CUSTOMER` user later
- billing logic should depend on customer records, not directly on auth records

### `UtilityMeter`

Represents a physical utility meter tied to one customer.

Important fields:

- meter number
- utility type
- billing mode
- company
- installation data
- active/inactive status

### `MeterReading`

Represents monthly captured consumption data.

Important fields:

- billing month
- reading date
- previous reading
- current reading
- consumption

Why previous reading is stored:

- preserves historical billing basis
- makes bills auditable
- prevents recalculation drift if future readings change

### `Tariff`, `TariffTier`, `TaxConfiguration`, `PenaltyConfiguration`

These model pricing configuration.

Why separate them:

- tariff handles core usage pricing
- tax handles tax policy
- penalty handles late fee policy
- each can evolve independently

### `Bill`

Represents the generated financial obligation for a billing cycle.

Important fields:

- bill number
- meter
- reading
- billing month
- consumption
- unit price
- amount
- paid amount
- balance
- due date
- status

Why this is stored as an independent entity:

- bills must remain historically stable
- later tariff changes should not rewrite old bills

### `Payment`

Represents money recorded against a bill.

Important fields:

- payment reference
- amount
- payment method
- payment status

### `CustomerNotification`

Represents tracked communication sent to the customer.

Why persist notifications:

- auditability
- customer service traceability
- clear success/failure record even when email fails

## 6. Business logic by service

### `AuthService`

Handles:

- registration
- login
- refresh token flow
- logout
- email verification
- password reset
- password change

Important design choice:

- registration creates `ROLE_CUSTOMER` users as `INACTIVE` until email verification

Why:

- ensures ownership of email address
- matches common secure onboarding flow

### `CustomerService`

Handles:

- customer creation
- update
- activation/deactivation
- linking customer profile to `ROLE_CUSTOMER` user
- resolving customers by ID or national ID

Important design choice:

- customer can be found by customer profile ID or linked user ID

Why:

- makes integration easier when different parts of the system refer to either identity model

### `MeterService`

Handles:

- assigning meters
- updating meters
- activation/deactivation
- listing by customer

Important design choice:

- meter assignment can auto-create a customer profile for an existing `ROLE_CUSTOMER` user

Why:

- reduces setup friction
- supports real onboarding sequences

### `MeterReadingService`

Handles:

- reading capture
- reading listing
- reading lookup

Important design choice:

- previous reading is derived from the latest stored reading, not manually entered

Why:

- prevents manipulation
- keeps consumption calculation consistent

### `TariffService`

Handles:

- tariff creation/deactivation
- tax creation/deactivation
- penalty creation/deactivation
- active tariff resolution for billing

Important design choices:

- tariff code must be unique
- start cycle cannot be in the past
- tier-based tariffs require tiers
- creating a new active tariff for the same utility + billing mode deactivates the previous one

Why:

- this acts like simple tariff versioning

### `BillService`

Handles:

- bill generation
- bill listing
- bill lookup

Important design choices:

- bill generation requires an already captured reading
- tariff is selected by utility type, billing mode, and billing month
- billing result is stored immutably as a bill record

Why:

- keeps pricing reproducible and auditable

### `PaymentService`

Handles:

- payment recording
- payment listing

Important design choices:

- overpayment is rejected
- duplicate payment references are rejected
- bill status is updated in the same transaction

Why:

- financial consistency is critical

### `NotificationService`

Handles:

- notification persistence
- email sending attempts
- notification queries

Important design choice:

- store notification first, send email second

Why:

- preserves an audit trail even if SMTP fails

## 7. Validation strategy

The code uses:

- standard bean validation annotations
- custom validation annotations

Examples:

- `@NotNull`
- `@NotBlank`
- `@Email`
- `@DecimalMin`
- `@PastOrPresent`
- `@ValidNationalId`
- `@ValidRwandanPhone`
- `@ValidName`

Why this was used:

- request rules stay close to request models
- validation errors are caught early
- controllers stay thin

## 8. Error handling strategy

Main file:

- [GlobalExceptionHandler.java](/mnt/data/landry/academics/rca/NE_prep/java/exam/official/utility-billing-system/src/main/java/com/template/exception/GlobalExceptionHandler.java)

What it does:

- converts exceptions into consistent JSON responses
- maps domain errors to correct HTTP codes

Examples:

- `400` for invalid input or illegal state
- `401` for invalid credentials/token issues
- `403` for forbidden access
- `404` for missing resources
- `409` for duplicates/conflicts

Why this is important:

- API consumers get predictable error responses
- controller code stays cleaner

## 9. Repository strategy

Repositories use Spring Data conventions such as:

- `findBy...`
- `existsBy...`
- `findTopBy...OrderBy...`

Why this is helpful:

- less boilerplate
- clearer intent
- enough power for the project scope without hand-writing many queries

Custom queries are used only when the business rule really needs them, such as tariff resolution by billing cycle.

## 10. Why DTOs instead of returning entities directly

This is one of the most important design decisions to explain to a teacher.

DTOs were used because they:

- protect internal persistence structure
- prevent accidental lazy-loading/API serialization issues
- allow request validation
- allow response shaping for business-friendly output
- make Swagger documentation easier to control

Example:

- `MeterReadingRequest` accepts `billingMonth` as `yyyy-MM`
- `MeterReadingResponse` returns normalized values suited for clients

## 11. Why enums are used

Enums such as:

- `Role`
- `UtilityType`
- `BillingMode`
- `TariffType`
- `BillStatus`
- `PaymentStatus`

were used because they:

- reduce invalid values
- make business states explicit
- improve readability in code and database

This is better than using free-form strings for core business states.

## 12. Why UUIDs are used for entity IDs

Most entities use UUID primary keys.

Why:

- safer for APIs than sequential IDs
- easier to merge/import data across systems
- harder to guess than numeric IDs

This is a reasonable choice for a distributed-style backend API.

## 13. Why transactions are used

Many service methods are marked `@Transactional`.

Why:

- related updates must succeed or fail together
- examples:
  - payment + bill update
  - bill generation + persistence logic
  - customer creation + linked user synchronization

Without transactions, partial updates could leave the system inconsistent.

## 14. Swagger/OpenAPI design

The project uses Springdoc for Swagger.

Why:

- easier testing from browser
- clearer endpoint discovery
- supports exam/demo presentation

The OpenAPI setup also adds:

- bearer token security scheme
- default 401/403 docs on secured endpoints
- improved examples for request bodies

## 15. How to explain the architecture to a teacher

A good simple explanation is:

1. `Controller` receives HTTP requests
2. `DTO` validates and shapes request data
3. `Service` applies business rules
4. `Repository` reads/writes database data
5. `Entity` represents stored domain objects
6. `ExceptionHandler` turns failures into clean API responses
7. `Security` protects endpoints with JWT and roles

You can describe it as:

"I used a layered Spring Boot architecture so that API logic, business rules, persistence, and security stay separate. That makes the system easier to test, explain, and maintain."

## 16. How to explain key design choices

If asked why you used specific things:

### Why Spring Boot?

- fast setup
- strong REST support
- built-in dependency injection
- security and JPA integrate well

### Why JPA?

- easier entity-based persistence
- less SQL boilerplate
- good fit for CRUD-heavy backend systems

### Why JWT?

- stateless API security
- easy Swagger/Postman testing
- good separation between login and protected endpoints

### Why DTOs?

- validation
- safer API contracts
- cleaner request/response shapes

### Why service layer?

- puts business rules in one place
- keeps controllers thin
- avoids mixing HTTP and domain logic

### Why custom validators?

- domain-specific rules like national ID and phone format should be reusable

### Why notifications persisted before send?

- audit trail matters more than delivery success alone

## 17. Suggested explanation summary

If you need a short oral summary:

"This is a Spring Boot REST API for utility billing. I separated the code into controllers, services, repositories, entities, DTOs, and security components. Authentication uses JWT with refresh tokens, business rules are implemented in service classes, and database access uses Spring Data JPA. I used DTOs and validation annotations to control API input cleanly, and I used role-based access control so admin, operator, finance, and customer users only access the parts of the system relevant to them. Billing depends on configured tariffs, captured meter readings, and customer status, which reflects the real utility billing workflow."
