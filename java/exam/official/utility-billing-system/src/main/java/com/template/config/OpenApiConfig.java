package com.template.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Utility Billing System API",
        version = "1.0.0",
        description = """
                Secure backend for WASAC and REG utility billing. The system manages customers, utility meters,
                monthly meter readings, postpaid billing, payments, notifications, JWT authentication, and admin
                user management.

                Local development uses PostgreSQL by default:
                DB_URL=jdbc:postgresql://localhost:5432/utility_billing_db
                DB_USERNAME=postgres
                DB_PASSWORD=postgres

                Secrets are loaded from a local .env file that must not be committed. Email delivery uses
                SMTP when EMAIL_DELIVERY=smtp. For Gmail, configure smtp.gmail.com:587, STARTTLS,
                MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM in .env. If EMAIL_DELIVERY=log is used as a
                fallback, verification and password-reset actionUrl values are printed to the logs.

                Exam domain coverage: WASAC water meters, REG electricity meters, prepaid-to-postpaid transition,
                monthly consumption, bill status tracking, payment recording, and notification delivery.
                """,
        contact = @Contact(name = "Utility Billing Exam Project", email = "noreply@utility-billing.local")
    ),
    servers = {
        @Server(url = "http://localhost:8080", description = "Local development"),
        @Server(url = "https://api.yourapp.com", description = "Production")
    }
)
@SecurityScheme(
    name = "bearerAuth",
    description = "JWT Bearer token. Format: Bearer <token>",
    scheme = "bearer",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}
