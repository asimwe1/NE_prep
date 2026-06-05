# Utility Billing System

Exam backend project for WASAC and REG utility billing.

## Scenario

WASAC provides water services and REG provides electricity services across Rwanda. Customers can own one or more utility meters. Water is billed postpaid, while electricity is currently prepaid but is planned to move to postpaid billing. The system should automate customers, meters, readings, monthly bills, payments, and notifications.

## Included Starters

- Spring Boot Web for REST APIs
- Spring Security with JWT and refresh tokens
- Spring Data JPA for persistence
- PostgreSQL for dev/prod data
- H2 for tests
- Bean Validation
- Mail + Thymeleaf email templates
- Swagger/OpenAPI
- Actuator health endpoints
- Lombok

## Initial Domain Model

- `Customer`: customer identity, contact info, address, active status
- `UtilityMeter`: WASAC/REG meter, water/electricity type, prepaid/postpaid mode
- `MeterReading`: monthly meter readings and consumption
- `Bill`: monthly postpaid bill, amount, balance, due date, status
- `Payment`: customer bill payments and payment status
- `CustomerNotification`: email/SMS-style notification records

## Local Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE utility_billing_db;
```

Copy `.env.example` to `.env` and fill the real local values. Keep `.env` uncommitted.

```bash
mvn spring-boot:run
```

The app starts at:

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`

Default admin account is created at startup:

- Email: `admin@example.com`
- Password: value of `ADMIN_DEFAULT_PASSWORD` in `.env`

## Exam Notes

The project is ready for adding controllers/services for:

- Customer registration and listing
- Meter assignment
- Monthly meter reading entry
- Postpaid bill generation
- Payment recording
- Overdue bill detection
- Email notifications
