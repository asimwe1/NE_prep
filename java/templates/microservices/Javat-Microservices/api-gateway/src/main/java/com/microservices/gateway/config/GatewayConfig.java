package com.microservices.gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Gateway route configuration
 * Routes can also be configured in application.yml
 * This class provides programmatic route configuration with additional features
 */
@Configuration
public class GatewayConfig {

    /**
     * Define custom routes with circuit breakers and filters
     * 
     * Note: Basic routes are configured in application.yml (loaded from Config Server)
     * This bean is for advanced route configurations with custom filters
     */
    @Bean
    public RouteLocator customRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
                // Health check route (bypass authentication in future)
                .route("health-check", r -> r
                        .path("/actuator/health")
                        .uri("forward:/actuator/health"))
                .build();
    }
}
