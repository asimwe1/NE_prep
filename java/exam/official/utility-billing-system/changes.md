# Utility Billing System Changes

Maintainer: asimwe001 / asimwe1

## 2026-06-05

### Project Scaffold

- Created the Spring Boot backend project under `java/exam/official/utility-billing-system`.
- Configured Maven project metadata as `com.utility:utility-billing-system`.
- Added Spring Boot starters for Web, Security, Data JPA, Validation, Mail, Thymeleaf, Actuator, and Swagger/OpenAPI.
- Added PostgreSQL runtime driver and H2 test database.
- Configured Java 21 and Maven-based build.
- Added Dockerfile and Docker Compose files for PostgreSQL and full app deployment.

### Exam Domain Setup

- Added WASAC/REG utility billing domain enums:
  - `CompanyType`
  - `UtilityType`
  - `BillingMode`
  - `BillStatus`
  - `PaymentStatus`
  - `NotificationStatus`
  - `NotificationType`
- Added initial JPA entities:
  - `Customer`
  - `UtilityMeter`
  - `MeterReading`
  - `Bill`
  - `Payment`
  - `CustomerNotification`
- Added repositories for customer, meter, reading, bill, payment, and notification records.
- Updated Swagger project description for the WASAC/REG utility billing scenario.
- Added README instructions for PostgreSQL database `utility_billing_db`.

### Task 1: User Management and Security

- Updated roles to exact exam roles:
  - `ROLE_ADMIN`
  - `ROLE_OPERATOR`
  - `ROLE_FINANCE`
  - `ROLE_CUSTOMER`
- Added explicit `UserStatus` enum with:
  - `ACTIVE`
  - `INACTIVE`
- Updated `User` model to include:
  - Full names
  - Email as username
  - Phone number
  - Password
  - Active/Inactive status
  - Role
- Updated signup so new users are created as inactive `ROLE_CUSTOMER` accounts.
- Kept email verification as the activation step.
- Updated default startup admin as active `ROLE_ADMIN`.
- Added admin user management support for:
  - Listing users
  - Viewing one user
  - Activating users
  - Deactivating users
  - Updating roles
  - Deleting users
- Verified JWT-protected endpoints require authentication.
- Verified admin endpoints work with an admin JWT token.

### Email and Local Environment

- Configured local `.env` support for PostgreSQL, JWT, SMTP, and default admin password.
- Configured Gmail SMTP values in the ignored local `.env`.
- Kept `.env.example` safe for Git tracking without real secrets.
- Confirmed PostgreSQL is reachable on `localhost:5432`.
- Confirmed IntelliJ is using app port `8080`, so schema initialization was run in non-web mode to avoid port conflict.

### PostgreSQL Schema Setup

- Ran the application once in non-web mode with `ddl-auto=create` to initialize the exam database schema.
- Seeded the default admin account during schema initialization.
- Verified PostgreSQL public schema contains:
  - `bills`
  - `customer_notifications`
  - `customers`
  - `items`
  - `meter_readings`
  - `payments`
  - `refresh_tokens`
  - `users`
  - `utility_meters`
- Normal application runs should continue using the configured `ddl-auto=update`.

### Runtime Stability

- Added handling for `AsyncRequestNotUsableException`.
- Client/browser disconnects no longer appear as unhandled backend failures.
- This handles cases where Swagger, browser refresh, or a closed HTTP connection aborts response streaming.

### Verification

- Ran Maven tests after Task 1 changes.
- Latest verified auth/security test result:
  - `Tests run: 9`
  - `Failures: 0`
  - `Errors: 0`
- Verified PostgreSQL schema creation separately after environment setup.
