# Running Operation Report

Scope: reviewed the README and the auth/runtime path in the Spring Boot app.

## Issues Found

1. `README.md` gives startup steps that do not match the repository state. It says to `cd springboot-template` and run `./mvnw spring-boot:run`, but this workspace is `spring_templ` and there is no Maven wrapper in the repo root. A new user following the README will fail before the app even starts. See [README.md](README.md#L17-L25).

2. JWT handling is configured for Base64 input, but the README example secret is not Base64. `JwtService` decodes `app.jwt.secret` with `Decoders.BASE64.decode(...)`, so copying `JWT_SECRET=your-secret` from the README will break token creation/validation as soon as login or refresh is used. See [README.md](README.md#L70-L84) and [JwtService.java](src/main/java/com/template/security/JwtService.java#L80-L83).

3. The password reset flow is broken end to end. `EmailService` sends a reset link to `GET /api/v1/auth/reset-password?token=...`, but `AuthController` only exposes `POST /api/v1/auth/reset-password` and expects a JSON body. Clicking the emailed link will not reach a working handler, so users cannot complete password reset from the email. See [EmailService.java](src/main/java/com/template/service/EmailService.java#L45-L52) and [AuthController.java](src/main/java/com/template/controller/AuthController.java#L66-L70).

4. Email-based account lookup is not normalized consistently. Registration checks `existsByEmail(request.getEmail())` before lowercasing, while the entity is saved with `request.getEmail().toLowerCase().trim()`. Login and recovery flows also use the raw email string. Mixed-case email input can therefore cause duplicate-key failures on registration or failed login/reset lookups for the same address. See [AuthService.java](src/main/java/com/template/service/AuthService.java#L47-L56) and [AuthService.java](src/main/java/com/template/service/AuthService.java#L94-L97).

5. The mail subsystem depends on concrete default SMTP values in `application.yml`. If environment variables are not provided or the defaults are invalid/revoked, registration, verification, and password reset will fail at runtime when email delivery is attempted. See [application.yml](src/main/resources/application.yml#L15-L20) and [EmailService.java](src/main/java/com/template/service/EmailService.java#L84-L98).

