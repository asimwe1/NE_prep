# Spring Boot Security Template

A clean Spring Boot starter for JWT auth, email verification, refresh tokens, role-based access, and PostgreSQL-ready deployment.

## What it includes

- Spring Boot 3.2.5
- Spring Security 6
- JWT + refresh token rotation
- Email verification and password reset
- H2 for local dev, PostgreSQL for prod
- Swagger/OpenAPI via SpringDoc
- Docker Compose support for app + PostgreSQL

## Quick start

```bash
cd springboot-template
```

### Local dev

```bash
./mvnw spring-boot:run
```

The app starts on `http://localhost:8080`.

Open:

- `http://localhost:8080/swagger-ui.html`
- `http://localhost:8080/h2-console`

Default admin:

- `admin@example.com`
- configured by `app.admin.default-password`

### Run production profile locally

```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_URL=jdbc:postgresql://localhost:5432/yourdb
export DB_USERNAME=postgres
export DB_PASSWORD=yourpassword
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
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
JWT_SECRET=replace_with_a_generated_secret
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@yourapp.com
MAIL_FROM_NAME=YourApp
APP_BASE_URL=http://localhost:8080
```

`.env` is ignored by `.gitignore` and should remain local.

## API docs

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Notes

- The default active profile is `dev`.
- `application-prod.yml` is the PostgreSQL production profile.
- Docker Compose uses a service hostname of `db` for Postgres.
- Do not commit secret values.
