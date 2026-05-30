# ERP Backend System

Java Spring Boot backend for the Government of Rwanda ERP practical. The system
manages employees, employment records, deduction rates, payroll generation,
payslips, payroll approval, JWT security, Swagger documentation, PostgreSQL, and
local email testing with Mailpit.

## Stack

- Java 21
- Spring Boot 4
- Spring Web
- Spring Data JPA
- Spring Security
- JWT
- PostgreSQL
- Spring Mail
- Swagger / OpenAPI
- Docker Compose
- Mailpit

## Modules

- `auth`: employee registration, login, JWT creation
- `employees`: employee personal details and roles
- `employment`: department, position, salary, and active employment records
- `deductions`: configurable tax and deduction rates
- `payroll`: payroll generation, payslips, pending payments, approval
- `notifications`: salary credited email messages
- `common`: security, exceptions, response envelope, configuration

## Local Services

Start PostgreSQL and Mailpit:

```powershell
docker compose up -d
```

Services:

- PostgreSQL: `127.0.0.1:5433`
- Mailpit SMTP: `localhost:1025`
- Mailpit inbox: `http://localhost:8025`

The app uses PostgreSQL on host port `5433` because this machine may already
have another PostgreSQL service using `5432`.

## Run The Application

```powershell
.\mvnw.cmd spring-boot:run
```

If the wrapper fails in PowerShell, use the Maven distribution already downloaded
by the wrapper or run from your IDE.

Application URLs:

- API base: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Mailpit inbox: `http://localhost:8025`

## Configuration

Default local configuration is in:

```text
src/main/resources/application.properties
```

Important defaults:

```properties
spring.datasource.url=jdbc:postgresql://127.0.0.1:5433/erp_system
spring.datasource.username=erp_user
spring.datasource.password=erp_password

spring.mail.host=localhost
spring.mail.port=1025
spring.mail.properties.mail.smtp.auth=false
spring.mail.properties.mail.smtp.starttls.enable=false
```

For real email delivery, use environment variables instead of hardcoding
credentials:

```properties
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_SMTP_AUTH=true
MAIL_STARTTLS=true
```

## Roles

- `ROLE_MANAGER`: create employees, create employment records, manage deduction
  rates, generate payroll
- `ROLE_ADMIN`: view employees, view payroll, approve payroll, view payslips
- `ROLE_EMPLOYEE`: view own details, view own payslips, view own pending salary

## Seeded Deduction Rates

The application seeds these deduction rates at startup:

| Code | Rate |
| --- | ---: |
| `EMPLOYEE_TAX` | 30% |
| `PENSION` | 6% |
| `MEDICAL_INSURANCE` | 5% |
| `CASH_ADVANCE` | 5% |
| `SINKING_FUND` | 1% |
| `TRANSPORT` | 1% |

Payroll uses employee tax, pension, medical insurance, and cash advance as the
active payroll deductions.

## Payroll Formula

```text
Housing = Base Salary x 14%
Transport = Base Salary x 14%
Gross Salary = Base Salary + Housing + Transport

Tax = Base Salary x 30%
Pension = Base Salary x 6%
Medical = Base Salary x 5%
Other = Base Salary x 5%

Net Salary = Gross Salary - (Tax + Pension + Medical + Other)
```

Example for base salary `70,000`:

```text
Gross = 89,600
Pension = 4,200
Net = 57,400
```

## Swagger Testing Flow

Open:

```text
http://localhost:8080/swagger-ui.html
```

### 1. Register A Manager

Endpoint:

```text
POST /api/auth/register
```

Body:

```json
{
  "code": "MGR001",
  "firstName": "Manager",
  "lastName": "Demo",
  "email": "manager@example.com",
  "password": "password123",
  "roles": ["ROLE_MANAGER"],
  "mobile": "250700000001",
  "dateOfBirth": "1990-01-01"
}
```

Copy the returned `token`.

### 2. Authorize Swagger

Click **Authorize** in Swagger and enter:

```text
Bearer <manager-token>
```

### 3. Register An Admin

Endpoint:

```text
POST /api/auth/register
```

Body:

```json
{
  "code": "ADM001",
  "firstName": "Admin",
  "lastName": "Demo",
  "email": "admin@example.com",
  "password": "password123",
  "roles": ["ROLE_ADMIN"],
  "mobile": "250700000002",
  "dateOfBirth": "1990-01-01"
}
```

Save the returned admin token for approving payroll.

### 4. Register An Employee

Endpoint:

```text
POST /api/auth/register
```

Body:

```json
{
  "code": "EMP001",
  "firstName": "Mugabo",
  "lastName": "Demo",
  "email": "employee@example.com",
  "password": "password123",
  "roles": ["ROLE_EMPLOYEE"],
  "mobile": "250700000003",
  "dateOfBirth": "1995-01-01"
}
```

Copy the returned employee `id`.

### 5. Create Employment Record

Use the manager token.

Endpoint:

```text
POST /api/employment
```

Body:

```json
{
  "code": "JOB001",
  "employeeId": 3,
  "department": "Finance",
  "position": "Accountant",
  "baseSalary": 70000,
  "status": "ACTIVE",
  "joiningDate": "2025-01-01"
}
```

Replace `employeeId` with the real employee id from step 4.

### 6. Generate Payroll

Use the manager token.

Endpoint:

```text
POST /api/payroll/generate
```

Body:

```json
{
  "month": 6,
  "year": 2025
}
```

Copy the returned payroll `id`.

### 7. Approve Payroll

Authorize Swagger with the admin token.

Endpoint:

```text
PATCH /api/payroll/{id}/approve
```

After approval:

- Payroll status changes to `PAID`
- A salary notification is stored
- Spring Mail sends the message to Mailpit

Open Mailpit:

```text
http://localhost:8025
```

You should see an email with subject:

```text
Salary credited
```

## Common Endpoints

| Method | Endpoint | Role |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/employees/me` | Authenticated |
| `GET` | `/api/employees` | Manager, Admin |
| `POST` | `/api/employees` | Manager |
| `POST` | `/api/employment` | Manager |
| `GET` | `/api/employment` | Manager, Admin |
| `GET` | `/api/deductions` | Authenticated |
| `POST` | `/api/deductions` | Manager |
| `POST` | `/api/payroll/generate` | Manager |
| `GET` | `/api/payroll?month=6&year=2025` | Manager, Admin |
| `GET` | `/api/payroll/me` | Admin, Employee |
| `GET` | `/api/payroll/me/pending` | Admin, Employee |
| `PATCH` | `/api/payroll/{id}/approve` | Admin |

## Run Tests

```powershell
.\mvnw.cmd test
```

Tests use an H2 in-memory database and do not require PostgreSQL.

## Notes

- Do not put real passwords in `application.properties`.
- Use Mailpit for local testing and real SMTP only when actual delivery is
  required.
- Duplicate payroll is blocked by both service logic and a database unique
  constraint.
