package com.template.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.models.responses.ApiResponse;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Set;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Utility Billing System API",
        version = "1.0.0",
        description = "WASAC/REG utility billing API. Login via /api/v1/auth/login, then Authorize with the JWT Bearer token.",
        contact = @Contact(name = "Utility Billing API")
    ),
    servers = {
        @Server(url = "http://localhost:8080", description = "Local")
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

    private static final Set<String> PUBLIC_AUTH_PATHS = Set.of(
            "/api/v1/auth/register",
            "/api/v1/auth/verify-email",
            "/api/v1/auth/resend-verification",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh-token",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password"
    );

    @Bean
    public OpenApiCustomizer securityErrorResponsesCustomizer() {
        return openApi -> openApi.getPaths().forEach((path, item) -> {
            if (PUBLIC_AUTH_PATHS.contains(path)) {
                return;
            }
            item.readOperations().forEach(operation -> {
                operation.getResponses().addApiResponse(
                        "401",
                        new ApiResponse().description("Unauthorized: login required or Bearer token is missing/invalid")
                );
                operation.getResponses().addApiResponse(
                        "403",
                        new ApiResponse().description("Forbidden: authenticated user role is not allowed to use this endpoint")
                );
            });
        });
    }
}
