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

---

### Task 0: Design Documents

- Created `docs/design-script/erd.dbml` — dbdiagram.io format covering all 12 tables: `users`, `refresh_tokens`, `customers`, `utility_meters`, `meter_readings`, `tariffs`, `tariff_tiers`, `tax_configurations`, `penalty_configurations`, `bills`, `payments`, `customer_notifications`.
  - Includes PKs (UUID), FK relationships, unique constraints, and status enums.
  - Covers tariff versioning fields (`effectiveStartCycle`, `effectiveEndCycle`, `active`, `version`).
- Created `docs/design-script/flow-diagram.md` — Mermaid flowcharts for 7 distinct flows:
  1. Authentication and token management
  2. Customer and meter setup
  3. Meter reading capture
  4. Tariff, tax, and penalty configuration
  5. Bill generation and calculation
  6. Payment processing
  7. Notifications
  - Plus an 8th role-authorization-gates summary diagram.
- Added `docs/design-visual/` folder with rendered SVG exports of all flow diagrams and the simplified ERD overview.

---

### Task 1: Cleanup and Entity Fixes

- Removed `Item` CRUD scaffolding that was not part of the exam domain:
  - Deleted `ItemController`, `ItemService`, `ItemRequest`, `ItemResponse`, `ItemRepository`, `Item` entity.
  - Removed Item routes from `SecurityConfig`.
- Added new domain enums:
  - `CustomerStatus` — `ACTIVE`, `INACTIVE`
  - `MeterStatus` — `ACTIVE`, `INACTIVE`
  - `TariffType` — `FLAT`, `TIER_BASED`
- Added `installationDate` (`LocalDate`) to `UtilityMeter`.
- Added `readingDate` (`LocalDate`) to `MeterReading` separate from `billingMonth`.
- Confirmed `Customer.status` uses `CustomerStatus` enum.
- Added new JPA entities with repositories:
  - `Tariff` — tariff code, utility type, billing mode, tariff type, version, effective cycles, fixed service charge, VAT rate, active flag.
  - `TariffTier` — tier range (`tierMin`, `tierMax`) and `unitPrice` per consumption unit.
  - `TaxConfiguration` — name, rate, utility type, effective from cycle, active flag.
  - `PenaltyConfiguration` — name, rate, grace period days, utility type.
- Added `TariffRepository`, `TariffTierRepository`, `TaxConfigurationRepository`, `PenaltyConfigurationRepository`.
- Added domain exception classes:
  - `DuplicateNationalIdException` (409)
  - `DuplicateMeterNumberException` (409)
  - `InactiveCustomerException` (400)
  - `OverpaymentException` (400)
  - `TariffNotFoundException` (404)

---

### Task 0 (T2): Input Validation Layer

- Created `com.template.validation` sub-package with three custom `ConstraintValidator` annotations:
  - `@ValidName` — `^[a-zA-Z\s'\-]+$` — letters, spaces, hyphens, apostrophes only. Rejects digits.
  - `@ValidRwandanPhone` — `^(\+?250|0)(7[2-9]|8[0-9])[0-9]{7}$` — valid Rwandan mobile numbers.
  - `@ValidNationalId` — `^[0-9]{16}$` — exactly 16 digits, no letters.
- Patched existing DTOs with new validators and tighter constraints:
  - `RegisterRequest`: `fullName` → `@ValidName`; `phoneNumber` → `@ValidRwandanPhone`; `password` → `@Size(min=8,max=128)` + `@Pattern` requiring at least one uppercase letter and one digit.
  - `ChangePasswordRequest`: `newPassword` raised to `@Size(min=8)` + same complexity `@Pattern`.
  - `LoginRequest`: confirmed `@Email @NotBlank` on email, `@NotBlank` on password.
- `GlobalExceptionHandler` already handles `MethodArgumentNotValidException` returning a field→message map. Verified this covers all new validators.

---

### Task 2: Customer and Meter Management

- Added `CustomerRequest` DTO with full Bean Validation (`@ValidName`, `@ValidNationalId`, `@ValidRwandanPhone`, `@Email`, `@Size`, `@NotBlank`).
- Added `CustomerResponse` DTO builder including `customerNumber`, `status`, timestamps.
- Implemented `CustomerService` (`@Transactional`):
  - `createCustomer` — auto-generates unique `customerNumber`, throws `DuplicateNationalIdException` if nationalId already exists.
  - `updateCustomer` — ADMIN-guarded, same duplicate check on NID change.
  - `listCustomers` — paginated.
  - `getById` / `getByNationalId`.
  - `activate` / `deactivate`.
  - `validateCustomerIsActive(customer)` — guard used by BillService.
- Added `CustomerController` at `/api/v1/customers` with `@PreAuthorize` role guards:
  - `POST /` — `ROLE_ADMIN`
  - `PUT /{id}` — `ROLE_ADMIN`
  - `GET /` — `ROLE_ADMIN`
  - `GET /{id}` — `ROLE_ADMIN` or `ROLE_CUSTOMER`
  - `PATCH /{id}/activate` and `/{id}/deactivate` — `ROLE_ADMIN`
- Added `MeterRequest` DTO with full Bean Validation (uppercase alphanumeric meter number pattern, `@PastOrPresent` installation date, etc.).
- Added `MeterResponse` DTO builder.
- Implemented `MeterService` (`@Transactional`):
  - `assignMeter` — throws `DuplicateMeterNumberException` if meter number exists, links to `Customer`.
  - `updateMeter` — with same duplicate guard.
  - `listMeters` — paginated.
  - `listByCustomer`.
  - `activate` / `deactivate`.
- Added `MeterController` at `/api/v1/meters` with `@PreAuthorize` role guards:
  - `POST /` — `ROLE_ADMIN`
  - `PUT /{id}` — `ROLE_ADMIN`
  - `GET /` — `ROLE_ADMIN` or `ROLE_OPERATOR`
  - `GET /customer/{customerId}` — `ROLE_ADMIN`, `ROLE_OPERATOR`, or `ROLE_CUSTOMER`
  - `PATCH /{id}/activate` and `/{id}/deactivate` — `ROLE_ADMIN`

---

### Task 3: Meter Reading Management

- Added `MeterReadingRequest` DTO:
  - `meterId` — `@NotNull`
  - `currentReading` — `@NotNull @DecimalMin("0.0") @Digits(integer=10,fraction=3)`
  - `readingDate` — `@NotNull @PastOrPresent`
  - `billingMonth` — `@NotNull @JsonFormat(pattern="yyyy-MM")` (YearMonth)
- Added `MeterReadingResponse` DTO builder with `billingMonth` formatted as `yyyy-MM` string.
- Extended `MeterReadingRepository`:
  - Added `findTopByMeterOrderByBillingMonthDesc` for previous-reading lookup.
  - Added paginated `findAll` and `findByMeter` queries.
- Added three new domain exceptions and registered handlers in `GlobalExceptionHandler`:
  - `DuplicateReadingException` — 409 when a reading already exists for the same meter + billing month.
  - `InactiveMeterException` — 400 when meter status is `INACTIVE`.
  - `InvalidReadingException` — 400 when `currentReading ≤ previousReading`.
- Implemented `MeterReadingService` (`@Transactional`):
  - `captureReading` enforces in order: meter ACTIVE check → billing month not in future → no duplicate reading for meter+month → `currentReading > previousReading` (previous auto-fetched from DB, defaults to zero for first reading) → calculates `consumption` → persists.
  - `listReadings` — paginated full list.
  - `getReadingsByMeter` — paginated by meter.
  - `getById`.
  - `findByMeterAndBillingMonth` — package-accessible for use by BillService.
- Added `MeterReadingController` at `/api/v1/readings` with `@PreAuthorize` role guards:
  - `POST /` — `ROLE_OPERATOR`
  - `GET /` — `ROLE_ADMIN` or `ROLE_OPERATOR`
  - `GET /meter/{meterId}` — `ROLE_ADMIN` or `ROLE_OPERATOR`
  - `GET /{id}` — `ROLE_ADMIN` or `ROLE_OPERATOR`
- `SecurityConfig` already had `/api/v1/readings/**` as `authenticated()`; fine-grained role control delegated to `@PreAuthorize` annotations.

### Verification

- Ran full `mvn test` after Task 3 (meter reading) implementation.
- All tests pass:
  - `Tests run: 9`
  - `Failures: 0`
  - `Errors: 0`

---

### Task 4: Tariff, Tax, and Penalty Configuration

**New exception classes:**
- `TariffNotFoundException` (404) — thrown when no active tariff exists for a given utility type + billing mode + billing month.
- `OverpaymentException` (400) — thrown when a payment amount exceeds the outstanding bill balance. Registered in `GlobalExceptionHandler`.

**New DTOs:**
- `TariffTierRequest` — `tierMin`, `tierMax` (`@DecimalMin("0.01")`), `unitPrice` (`@DecimalMin("0.01") @Digits(integer=10,fraction=2)`).
- `TariffTierResponse` — mirrors entity fields plus UUID id.
- `TariffRequest` — tariff code (`@Pattern(regexp="^[A-Z0-9_\\-]+$")`), utility/billing/tariff type (`@NotNull`), version (`@Min(1)`), `effectiveStartCycle` / `effectiveEndCycle` (YearMonth via `@JsonFormat`), `fixedServiceCharge`, `vatRate` (`@DecimalMax("100.0")`), `tiers` list (`@Valid`).
- `TariffResponse` — full tariff data including tier list and timestamps.
- `TaxConfigurationRequest` — `name` (`@ValidName`), `rate`, `utilityType`, `effectiveFrom` (YearMonth).
- `TaxConfigurationResponse` — id, name, rate, utilityType, effectiveFrom, active, createdAt.
- `PenaltyConfigurationRequest` — `name` (`@ValidName`), `rate`, `gracePeriodDays` (`@Min(0) @Max(365)`), `utilityType`.
- `PenaltyConfigurationResponse` — id, name, rate, gracePeriodDays, utilityType, active, createdAt.

**`TariffRepository` extended:**
- Added `findActiveTariffsForBillingMonth` JPQL query — finds active tariffs where `effectiveStartCycle <= billingMonth` and `effectiveEndCycle IS NULL OR effectiveEndCycle >= billingMonth`, ordered by version descending. Uses lexicographic string comparison on `YYYY-MM` format.

**`TariffService` implemented (`@Transactional`):**
- `createTariff` — validates tariff code uniqueness; rejects `effectiveStartCycle` in the past; performs cross-field `tierMax > tierMin` check; automatically deactivates the current active tariff for the same utility type + billing mode before creating the new version; saves tariff and all tiers in one transaction.
- `deactivateTariff` — marks a tariff inactive by ID.
- `getActiveTariff(utilityType, billingMode, billingMonth)` — resolves effective tariff for use by BillService; throws `TariffNotFoundException` if none found.
- `listTariffs` — paginated.
- `getTariffById`.
- `createTaxConfig` / `deactivateTaxConfig` / `listTaxConfigs`.
- `createPenaltyConfig` / `deactivatePenaltyConfig` / `listPenaltyConfigs`.

**`TariffController` added at `/api/v1/tariffs` — all endpoints `@PreAuthorize("hasRole('ADMIN')")`:**
- `POST /` — create tariff.
- `GET /` — list tariffs (paginated).
- `GET /{id}` — get tariff by ID.
- `PATCH /{id}/deactivate` — deactivate tariff.
- `POST /taxes` — create tax configuration.
- `GET /taxes` — list tax configurations (paginated).
- `PATCH /taxes/{id}/deactivate` — deactivate tax configuration.
- `POST /penalties` — create penalty configuration.
- `GET /penalties` — list penalty configurations (paginated).
- `PATCH /penalties/{id}/deactivate` — deactivate penalty configuration.

---

### Task 5a: Bill Generation

**New DTOs:**
- `BillGenerateRequest` — `meterId` (`@NotNull`), `billingMonth` (YearMonth `@NotNull @JsonFormat`).
- `BillResponse` — full bill snapshot: bill number, customer/meter identifiers, billing month, consumption, unitPrice, amount, paidAmount, balance, status, dueDate, timestamps.

**`BillRepository` extended:**
- Added `Page<Bill> findByCustomerOrderByBillingMonthDesc(Customer, Pageable)` overload.

**`BillService` implemented (`@Transactional`):**
- `generateBill` enforces in order:
  1. Billing month must not be in the future.
  2. Load meter → load customer → `validateCustomerIsActive` (throws `InactiveCustomerException` if INACTIVE).
  3. Load reading for meter + billing month (throws `ResourceNotFoundException` if missing).
  4. Resolve active tariff via `TariffService.getActiveTariff`.
  5. **FLAT tariff:** `amount = consumption × tier[0].unitPrice`.
  6. **TIER_BASED tariff:** iterate tiers sorted by `tierMin`; apply each tier's unit price to its consumption slice; any consumption beyond the last tier uses the last tier's rate.
  7. `baseAmount = consumptionCharge + fixedServiceCharge`.
  8. `vatAmount = baseAmount × vatRate / 100` (HALF_UP rounding).
  9. `totalAmount = baseAmount + vatAmount`.
  10. Penalty: if `billingMonth.atEndOfMonth() + gracePeriodDays < today`, adds `totalAmount × penaltyRate / 100`.
  11. Generates unique bill number (`BILL-YYYYMM-XXXXXX`).
  12. Sets `dueDate = today + 30 days`, `paidAmount = 0`, `balance = totalAmount`, `status = PENDING`.
  13. Persists bill → calls `NotificationService.notifyBillGenerated`.
- `listBills` — paginated.
- `getBillById`.
- `getBillsByCustomer(customerId, pageable)`.

**`BillController` added at `/api/v1/bills`:**
- `POST /generate` — `ROLE_ADMIN` or `ROLE_FINANCE`.
- `GET /` — `ROLE_ADMIN` or `ROLE_FINANCE`.
- `GET /{id}` — `ROLE_ADMIN`, `ROLE_FINANCE`, or `ROLE_CUSTOMER`.
- `GET /customer/{customerId}` — `ROLE_ADMIN`, `ROLE_FINANCE`, or `ROLE_CUSTOMER`.

---

### Task 5b: Payment Processing

**New DTOs:**
- `PaymentRequest` — `billId` (`@NotNull`), `amount` (`@DecimalMin("0.01") @Digits(integer=15,fraction=2)`), `paymentMethod` (`@Size(max=50)`), `paymentReference` (`@Pattern(regexp="^[A-Z0-9\\-]+$") @Size(min=6,max=100)`).
- `PaymentResponse` — payment id, reference, bill id/number, customer id/name, amount, method, status, bill balance, bill status, paidAt.

**`PaymentRepository` extended:**
- Added `Page<Payment> findByBill(Bill, Pageable)` overload.

**`PaymentService` implemented (`@Transactional`):**
- `recordPayment` enforces:
  1. Bill must not already be `PAID` (throws `IllegalStateException`).
  2. Payment reference must be unique (throws `IllegalArgumentException` on duplicate).
  3. `amount ≤ bill.balance` (throws `OverpaymentException` if exceeded).
  4. Updates `bill.paidAmount += amount` and `bill.balance -= amount`.
  5. If `balance == 0`: sets `bill.status = PAID` and calls `NotificationService.notifyPaymentReceived`.
  6. Otherwise: sets `bill.status = PARTIALLY_PAID`.
  7. Creates and persists `Payment` record.
- `listPayments` — paginated.
- `getPaymentsByBill(billId, pageable)`.

**`PaymentController` added at `/api/v1/payments`:**
- `POST /` — `ROLE_FINANCE`.
- `GET /` — `ROLE_FINANCE`.
- `GET /bill/{billId}` — `ROLE_ADMIN` or `ROLE_FINANCE`.

---

### Task 6: Notification Service and Email Templates

**`NotificationResponse` DTO** — id, customerId, customerName, type, status, recipient, subject, message, createdAt, sentAt.

**`CustomerNotificationRepository` extended:**
- Added `Page<CustomerNotification> findByCustomerOrderByCreatedAtDesc(Customer, Pageable)` overload.

**`NotificationService` implemented:**
- `notifyBillGenerated(Bill)`:
  - Persists `CustomerNotification` with type `BILL_GENERATED`, status `PENDING`.
  - Sends `bill-generated.html` Thymeleaf email via `EmailService.sendCustomEmail` (async).
  - Updates notification status to `SENT` on success or `FAILED` on exception. Persists final status.
  - Message format: `Dear <fullName>, Your <YYYY-MM> utility bill of <amount> FRW has been successfully processed.`
- `notifyPaymentReceived(Bill)`:
  - Same pattern using `PAYMENT_RECEIVED` type and `payment-received.html` template.
- `listAll(pageable)` — paginated.
- `listByCustomer(customerId, pageable)`.

**New Thymeleaf email templates** (`src/main/resources/templates/email/`):
- `bill-generated.html` — blue-themed; shows bill number, billing month, total amount, due date.
- `payment-received.html` — green-themed; shows "PAID IN FULL" badge, bill number, billing month, total bill amount, amount paid.

**`NotificationController` added at `/api/v1/notifications`:**
- `GET /` — `ROLE_ADMIN`.
- `GET /customer/{customerId}` — `ROLE_ADMIN` or `ROLE_CUSTOMER`.

---

### Verification

- Ran full `mvn test` after T4/T5/T6 implementation.
- All tests pass:
  - `Tests run: 9`
  - `Failures: 0`
  - `Errors: 0`

### Git History (asimwe001 only)

| Commit | Message |
|--------|---------|
| `14e92a9` | Add tariff, tax, and penalty configuration management |
| `e13ff71` | T5: Add bill generation, notification service, and email templates |
| `126d2c4` | T6: Add payment processing with overpayment guard and full-pay notification |

---

### Codebase Documentation Cleanup

- Added concise comments only where business rules or implementation choices need context:
  - JWT request authentication reloads user details so role/status changes apply immediately.
  - JWT signing hashes the configured text secret so `.env` secrets do not need Base64 encoding.
  - Security configuration keeps public endpoints limited and delegates exam role rules to controllers.
  - Client-abort exceptions are treated as browser/client disconnects, not backend failures.
  - Bill generation documents calculation order, tariff resolution, tiered pricing, and late penalties.
  - Payment processing documents transaction boundaries and full-payment notification behavior.
  - Meter reading capture documents previous-reading derivation and one-reading-per-cycle rules.
  - Tariff creation documents versioning behavior and historical bill safety.
  - Notification service documents audit-first persistence before SMTP delivery.
- Cleaned decorative or corrupted comment separators from Java source files.
- Rewrote `src/main/resources/db/routines.sql` comments in clean ASCII while preserving trigger behavior.
- Added short Javadocs to reusable validation annotations:
  - `@ValidName`
  - `@ValidNationalId`
  - `@ValidRwandanPhone`
