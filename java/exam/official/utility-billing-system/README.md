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

## Docker Setup

You can run the full app stack without installing Java, Maven, or PostgreSQL locally:

```bash
docker compose up --build
```

This starts:

- API: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui.html`
- PostgreSQL: `localhost:5433`

The Docker compose file treats host and container database URLs differently:

- local host run can use `DB_URL=jdbc:postgresql://localhost:5432/...`
- Docker app run uses `DOCKER_DB_URL=jdbc:postgresql://utility-billing-db:5432/...`

That avoids the common failure where a container tries to connect to `localhost` instead of the database service.

If you want to override values, create a `.env` file in the project root. Useful keys include:

- `APP_PORT`
- `DB_PORT`
- `POSTGRES_DB`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DOCKER_DB_URL`
- `JWT_SECRET`
- `ADMIN_DEFAULT_PASSWORD`

To stop the stack:

```bash
docker compose down
```

To stop it and also remove the PostgreSQL data volume:

```bash
docker compose down -v
```

## Docker Maven Environment

If you want Maven available through Docker for builds, tests, or local development commands, use the `maven` service.

Start only the database first:

```bash
docker compose up -d db
```

Run Maven commands inside the container:

```bash
docker compose run --rm --profile tools maven mvn clean test
docker compose run --rm --profile tools maven mvn spring-boot:run
docker compose run --rm --profile tools maven mvn package
```

Notes:

- The project folder is mounted into the Maven container at `/workspace`
- Maven dependencies are cached in a Docker volume, so later runs are faster
- The Maven container connects to the same Postgres container using `db:5432`
- If you run `mvn spring-boot:run` this way, the app uses the containerized Java and Maven toolchain instead of your host machine

## Exam Notes

The project is ready for adding controllers/services for:

- Customer registration and listing
- Meter assignment
- Monthly meter reading entry
- Postpaid bill generation
- Payment recording
- Overdue bill detection
- Email notifications
