package com.microservices.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

/**
 * Gateway filter factory to preserve HTTP status codes from downstream services
 */
@Component
public class StatusPreservingGatewayFilterFactory extends AbstractGatewayFilterFactory<Object> {

    @Override
    public GatewayFilter apply(Object config) {
        return (exchange, chain) -> {
            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                // Get the status code from the response received from downstream service
                ServerHttpResponse response = exchange.getResponse();
                
                // Check if there's a client response (from the downstream service)
                Object clientResponse = exchange.getAttribute(ServerWebExchangeUtils.CLIENT_RESPONSE_ATTR);
                
                if (clientResponse != null && response.getStatusCode() != null) {
                    HttpStatusCode originalStatus = response.getStatusCode();
                    // Explicitly set the status code again to ensure it's not changed
                    response.setStatusCode(originalStatus);
                }
            }));
        };
    }
}
