# API Gateway

Spring Cloud Gateway - Single entry point for all microservices with routing, load balancing, and circuit breaker support.

## Overview

The API Gateway serves as the single entry point for all client requests. It routes requests to appropriate microservices based on URL patterns, provides load balancing, circuit breaker protection, and cross-cutting concerns like logging and correlation IDs.

## Features

✅ **Dynamic Routing** - Routes requests based on URL patterns  
✅ **Service Discovery** - Integrates with Eureka for automatic service location  
✅ **Load Balancing** - Client-side load balancing across service instances  
✅ **Circuit Breaker** - Resilience4j for fault tolerance  
✅ **Request Logging** - Automatic logging of all requests and responses  
✅ **Correlation IDs** - Distributed tracing support  
✅ **Config Management** - Loads configuration from Config Server  
✅ **Fallback Handling** - Graceful degradation when services are unavailable

## Quick Start

### Prerequisites

Ensure these services are running:
1. Discovery Service (port 8761)
2. Config Server (port 8888)

### Start API Gateway

```bash
cd api-gateway
mvn spring-boot:run
```

### Verify Gateway

- **Root**: http://localhost:8080/
- **Health**: http://localhost:8080/actuator/health
- **Gateway Routes**: http://localhost:8080/actuator/gateway/routes

## Routing Configuration

### Routes (Configured in Config Server)

The main routes are configured in Config Server's `config-repo/api-gateway.yml`:

```yaml
spring:
  cloud:
    gateway:
      routes:
        # User Service
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
        
        # Auth Service
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/api/auth/**
        
        # Notification Service
        - id: notification-service
          uri: lb://notification-service
          predicates:
            - Path=/api/notifications/**
```

### Route Components

| Component | Description |
|-----------|-------------|
| **id** | Unique route identifier |
| **uri** | Target service (lb:// = load balanced via Eureka) |
| **predicates** | Conditions for matching requests |
| **filters** | Request/response transformations |

## Request Flow

```
Client Request
    ↓
API Gateway (8080)
    ↓
Correlation ID Filter
    ↓
Logging Filter
    ↓
Route Matching
    ↓
Circuit Breaker
    ↓
Load Balancer (Eureka)
    ↓
Target Microservice
    ↓
Response
    ↓
Client
```

## URL Patterns

Once microservices are running:

| Pattern | Routes To | Description |
|---------|-----------|-------------|
| `/api/users/**` | User Service (8081) | User management |
| `/api/auth/**` | Auth Service (8082) | Authentication |
| `/api/notifications/**` | Notification Service (8083) | Notifications |
| `/actuator/**` | Gateway itself | Health, metrics, routes |

### Examples

```bash
# User Service (via Gateway)
curl http://localhost:8080/api/users

# Auth Service (via Gateway)
curl http://localhost:8080/api/auth/login

# Direct to service (bypass Gateway)
curl http://localhost:8081/api/users
```

## Global Filters

### 1. LoggingFilter
Logs all incoming requests and outgoing responses with timing information.

**Order**: HIGHEST_PRECEDENCE

**Output**:
```
Incoming request: GET /api/users from /127.0.0.1:12345
Completed request: GET /api/users - Status: 200 OK - Duration: 125ms
```

### 2. CorrelationIdFilter
Adds correlation and request IDs for distributed tracing.

**Order**: HIGHEST_PRECEDENCE + 1

**Headers Added**:
- `X-Correlation-ID`: Tracks request across services
- `X-Request-ID`: Unique ID for this specific request

## Circuit Breaker Configuration

Resilience4j configuration in `application.yml`:

```yaml
resilience4j:
  circuitbreaker:
    configs:
      default:
        sliding-window-size: 10              # Number of calls to record
        failure-rate-threshold: 50           # 50% failure opens circuit
        wait-duration-in-open-state: 10000   # Wait 10s before retry
        permitted-number-of-calls-in-half-open-state: 3
```

### Circuit States

1. **CLOSED**: Normal operation, requests go through
2. **OPEN**: Too many failures, requests fail immediately
3. **HALF_OPEN**: Testing if service recovered

### Fallback Response

When circuit is open:

```json
{
  "success": false,
  "message": "Service temporarily unavailable. Please try again later.",
  "errorCode": "SERVICE_UNAVAILABLE",
  "statusCode": 503,
  "timestamp": "2026-06-04T14:30:00"
}
```

## Load Balancing

Uses Ribbon (via Eureka) for client-side load balancing:

### Automatic Load Balancing

```yaml
uri: lb://user-service  # lb:// prefix enables load balancing
```

Gateway automatically:
1. Discovers all `user-service` instances from Eureka
2. Distributes requests across instances
3. Removes unhealthy instances from pool

### Load Balancing Strategies

Default: **Round Robin**

Configure in Config Server:
```yaml
user-service:
  ribbon:
    NFLoadBalancerRuleClassName: com.netflix.loadbalancer.RandomRule
```

Options:
- `RoundRobinRule` - Round robin (default)
- `RandomRule` - Random selection
- `WeightedResponseTimeRule` - Based on response time
- `BestAvailableRule` - Lowest concurrent requests

## Testing Gateway

### Test Routing

```bash
# Get gateway routes
curl http://localhost:8080/actuator/gateway/routes

# Refresh routes (after config change)
curl -X POST http://localhost:8080/actuator/refresh
```

### Test Circuit Breaker

```bash
# Stop a microservice to trigger circuit breaker
# Then make requests to see fallback response
curl http://localhost:8080/api/users
```

### Test Load Balancing

```bash
# Start multiple instances of same service
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8091"

# Make multiple requests - should distribute across instances
for i in {1..10}; do curl http://localhost:8080/api/users; done
```

## Custom Route Predicates

### Path Predicate
```yaml
predicates:
  - Path=/api/users/**
```

### Method Predicate
```yaml
predicates:
  - Path=/api/users/**
  - Method=GET,POST
```

### Header Predicate
```yaml
predicates:
  - Path=/api/admin/**
  - Header=X-Admin-Token, secret123
```

### Query Parameter Predicate
```yaml
predicates:
  - Path=/api/users/**
  - Query=version, v2
```

### Time-Based Predicate
```yaml
predicates:
  - Path=/api/beta/**
  - Before=2026-12-31T23:59:59
```

## Custom Route Filters

### Add Request Header
```yaml
filters:
  - AddRequestHeader=X-Request-Source, gateway
```

### Add Response Header
```yaml
filters:
  - AddResponseHeader=X-Response-Time, ${timestamp}
```

### Rewrite Path
```yaml
filters:
  - RewritePath=/v1/(?<segment>.*), /$\{segment}
```

### Strip Prefix
```yaml
filters:
  - StripPrefix=1  # Removes first path segment
```

### Retry
```yaml
filters:
  - name: Retry
    args:
      retries: 3
      statuses: BAD_GATEWAY,SERVICE_UNAVAILABLE
```

## Rate Limiting (Future Enhancement)

Can be added using Redis-based rate limiter:

```yaml
filters:
  - name: RequestRateLimiter
    args:
      redis-rate-limiter:
        replenish-rate: 10
        burst-capacity: 20
```

## Monitoring

### Actuator Endpoints

| Endpoint | Description |
|----------|-------------|
| `/actuator/health` | Gateway health status |
| `/actuator/metrics` | Gateway metrics |
| `/actuator/gateway/routes` | All configured routes |
| `/actuator/gateway/refresh` | Refresh routes from config |

### Metrics

```bash
# Get all metrics
curl http://localhost:8080/actuator/metrics

# Specific metric
curl http://localhost:8080/actuator/metrics/gateway.requests
```

## Troubleshooting

### Gateway Not Starting

**Problem**: Failed to start ApiGatewayApplication

**Solutions**:
1. Ensure Discovery Service is running
2. Ensure Config Server is running
3. Check port 8080 is not in use
4. Verify bootstrap.yml configuration

### Routes Not Working

**Problem**: 404 error when accessing routes

**Solutions**:
1. Check service is registered in Eureka: http://localhost:8761
2. Verify route configuration: http://localhost:8080/actuator/gateway/routes
3. Check service name in route matches Eureka registration
4. Test direct service access (bypass gateway)

### Circuit Breaker Always Open

**Problem**: Fallback always triggered

**Solutions**:
1. Check target service is running and healthy
2. Adjust failure threshold in Resilience4j config
3. Check service response time < timeout
4. Review circuit breaker metrics

### Load Balancing Not Working

**Problem**: Requests always go to same instance

**Solutions**:
1. Verify multiple instances registered in Eureka
2. Check instance IDs are unique
3. Ensure `lb://` prefix in route URI
4. Review load balancer logs

## Best Practices

1. **Use lb:// prefix** - Enable load balancing for all routes
2. **Configure timeouts** - Set appropriate timeouts for each route
3. **Enable circuit breakers** - Protect against cascading failures
4. **Add correlation IDs** - Enable distributed tracing
5. **Log all requests** - Monitor gateway traffic
6. **Use fallback handlers** - Provide friendly error messages
7. **Secure sensitive routes** - Add authentication filters (future)
8. **Rate limit APIs** - Prevent abuse (future enhancement)

## Port Reference

- **8761**: Discovery Service
- **8888**: Config Server
- **8080**: **API Gateway** ← You are here
- **8081**: User Service (behind gateway)
- **8082**: Auth Service (behind gateway)
- **8083**: Notification Service (behind gateway)

## Startup Order

```
1. Discovery Service (8761)
   ↓
2. Config Server (8888)
   ↓
3. API Gateway (8080)
   ↓
4. Microservices (8081+)
```

## Next Steps

After API Gateway is running:
1. ✅ **Build Microservices** - User, Auth, Notification services
2. ✅ **Add Authentication** - JWT validation in gateway
3. ✅ **Add Rate Limiting** - Protect against abuse
4. ✅ **Add API Documentation** - Swagger/OpenAPI aggregation

---

**Status**: ✅ Ready for Development  
**Access**: http://localhost:8080  
**Start this after Discovery Service and Config Server!**
