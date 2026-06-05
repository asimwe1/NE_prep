# Spring Boot Security Template

A clean Spring Boot starter for JWT auth, email verification, refresh tokens, role-based access, and PostgreSQL-ready deployment.

## What it includes

- Spring Boot 3.2.5
- Spring Security 6
- JWT + refresh token rotation
- Email verification and password reset
- PostgreSQL for local dev and prod
- H2 for tests
- Swagger/OpenAPI via SpringDoc
- Docker Compose support for app + PostgreSQL

## Quick start

```bash
cd springboot-template
```

### Local dev

Create a local `.env` file first:

```bash
cp .env.example .env
```

Fill in real values in `.env`. That file is ignored by Git and is loaded by Spring Boot through `spring.config.import`.

```bash
./mvnw spring-boot:run
```

The app starts on `http://localhost:8080`.

Open:

- `http://localhost:8080/swagger-ui.html`
Before running, make sure PostgreSQL is running locally and has a database named `templatedb`.

Default local database settings:

```dotenv
DB_URL=jdbc:postgresql://localhost:5432/templatedb
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

In local dev, verification and password-reset links are written to the application logs by default. Use the `actionUrl` from the log to verify the account or reset the password.

Default admin:

- `admin@example.com`
- password comes from `ADMIN_DEFAULT_PASSWORD` in `.env`

### Run production profile locally

```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_URL=jdbc:postgresql://localhost:5432/yourdb
export DB_USERNAME=postgres
export DB_PASSWORD=your_database_password
./mvnw spring-boot:run
```

## Docker

Use the provided Docker Compose definition to run the backend and Postgres together.

```bash
docker compose up --build
```

The app is available at `http://localhost:8080`.

The Compose setup uses your local `.env` file and also sets:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL=jdbc:postgresql://db:5432/templatedb`

So your JWT, email, and app settings from `.env` are applied.

## Environment variables

Example `.env` values:

```dotenv
DB_URL=jdbc:postgresql://localhost:5432/templatedb
DB_USERNAME=postgres
DB_PASSWORD=postgres
JWT_SECRET=replace_with_a_generated_secret
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SMTP_AUTH=false
MAIL_STARTTLS=false
MAIL_STARTTLS_REQUIRED=false
MAIL_FROM=noreply@yourapp.com
MAIL_FROM_NAME=YourApp
APP_BASE_URL=http://localhost:8080
ADMIN_DEFAULT_PASSWORD=replace_with_a_local_admin_password
```

`.env` is ignored by `.gitignore` and should remain local.

For Gmail SMTP, create a Gmail app password, put it in `MAIL_PASSWORD` inside `.env`, and rotate it immediately if it is ever committed or shared.

To send through SMTP instead of logging email links, set `EMAIL_DELIVERY=smtp`. For local Mailpit, keep `MAIL_HOST=localhost`, `MAIL_PORT=1025`, and open Mailpit at `http://localhost:8025`. For Gmail, also set `MAIL_SMTP_AUTH=true`, `MAIL_STARTTLS=true`, and `MAIL_STARTTLS_REQUIRED=true`.

When `EMAIL_DELIVERY=log`, keep `MAIL_HEALTH_ENABLED=false` so Actuator does not check a local SMTP server that is not running.

## API docs

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Notes

- The default active profile is `dev`.
- `application-prod.yml` is the PostgreSQL production profile.
- Docker Compose uses a service hostname of `db` for Postgres.
- Do not commit secret values.
