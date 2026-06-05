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
        title = "Spring Boot Starter Backend API",
        version = "1.0.0",
        description = """
                Spring Boot starter backend with JWT authentication, PostgreSQL persistence, account verification,
                password reset, admin user management, and a sample items CRUD resource.

                Local development uses PostgreSQL by default:
                DB_URL=jdbc:postgresql://localhost:5432/templatedb
                DB_USERNAME=postgres
                DB_PASSWORD=postgres

                Secrets are loaded from a local .env file that must not be committed. Email delivery uses
                SMTP when EMAIL_DELIVERY=smtp. For Gmail, configure smtp.gmail.com:587, STARTTLS,
                MAIL_USERNAME, MAIL_PASSWORD, and MAIL_FROM in .env. If EMAIL_DELIVERY=log is used as a
                fallback, verification and password-reset actionUrl values are printed to the logs.

                List endpoints use simple pagination only: page and size. Sorting is intentionally not exposed
                in Swagger to avoid invalid sort-field failures while keeping list-all requests simple.
                """,
        contact = @Contact(name = "Java NE Template", email = "noreply@yourapp.com")
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
