package com.microservices.gateway.filter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.support.ServerWebExchangeUtils;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

/**
 * Global filter for logging all incoming requests and outgoing responses
 * Also preserves HTTP status codes from backend services
 */
@Slf4j
@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final String START_TIME_ATTR = "startTime";
    private static final String BACKEND_STATUS_ATTR = "backendStatus";

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        Instant startTime = Instant.now();
        exchange.getAttributes().put(START_TIME_ATTR, startTime);
        
        log.info("Incoming request: {} {} from {}",
                request.getMethod(),
                request.getPath(),
                request.getRemoteAddress());

        return chain.filter(exchange)
                .doOnSuccess(aVoid -> {
                    // Capture the backend response status
                    ServerHttpResponse response = exchange.getResponse();
                    HttpStatusCode backendStatus = response.getStatusCode();
                    
                    if (backendStatus != null) {
                        exchange.getAttributes().put(BACKEND_STATUS_ATTR, backendStatus);
                    }
                })
                .then(Mono.fromRunnable(() -> {
                    ServerHttpResponse response = exchange.getResponse();
                    Instant start = exchange.getAttribute(START_TIME_ATTR);
                    HttpStatusCode backendStatus = exchange.getAttribute(BACKEND_STATUS_ATTR);
                    
                    Duration duration = start != null ? Duration.between(start, Instant.now()) : Duration.ZERO;
                    
                    // Restore backend status if it was captured
                    if (backendStatus != null && !backendStatus.equals(response.getStatusCode())) {
                        log.debug("Restoring backend status code: {} -> {}", 
                                response.getStatusCode(), backendStatus);
                        response.setStatusCode(backendStatus);
                    }
                    
                    log.info("Completed request: {} {} - Status: {} - Duration: {}ms",
                            request.getMethod(),
                            request.getPath(),
                            response.getStatusCode(),
                            duration.toMillis());
                }));
    }

    @Override
    public int getOrder() {
        // Run early to capture timing
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }
}
