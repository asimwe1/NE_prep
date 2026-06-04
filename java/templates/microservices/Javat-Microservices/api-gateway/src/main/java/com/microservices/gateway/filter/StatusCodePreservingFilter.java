package com.microservices.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Preserves HTTP status codes from backend services
 * Ensures Gateway doesn't normalize status codes (like 201 to 200)
 */
@Component
public class StatusCodePreservingFilter implements GlobalFilter, Ordered {

    private static final String STATUS_CODE_ATTR = "ORIGINAL_STATUS_CODE";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return chain.filter(exchange).doOnSuccess(aVoid -> {
            ServerHttpResponse response = exchange.getResponse();
            HttpStatusCode statusCode = response.getStatusCode();
            
            // Store the original status code if it's set
            if (statusCode != null) {
                exchange.getAttributes().put(STATUS_CODE_ATTR, statusCode);
            }
        }).then(Mono.fromRunnable(() -> {
            // Retrieve and re-apply the original status code
            HttpStatusCode originalStatus = exchange.getAttribute(STATUS_CODE_ATTR);
            if (originalStatus != null) {
                exchange.getResponse().setStatusCode(originalStatus);
            }
        }));
    }

    @Override
    public int getOrder() {
        // Run after routing filter (which is at 0)
        // But before any other response modification filters
        return Ordered.LOWEST_PRECEDENCE - 10;
    }
}
