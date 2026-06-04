# API Gateway - Quick Start

## TL;DR

```bash
# Ensure services are running:
# 1. Discovery Service (8761)
# 2. Config Server (8888)

# Start API Gateway
cd api-gateway
mvn spring-boot:run

# Test
curl http://localhost:8080/
```

## Build Commands

```bash
# Build
mvn clean package

# Run
mvn spring-boot:run

# Run with Docker
docker build -t api-gateway:1.0.0 .
docker run -p 8080:8080 api-gateway:1.0.0
```

## Verify Gateway

```bash
# Gateway root
curl http://localhost:8080/

# Health check
curl http://localhost:8080/actuator/health

# View all routes
curl http://localhost:8080/actuator/gateway/routes

# Refresh routes (after config change)
curl -X POST http://localhost:8080/actuator/refresh
```

## Test Routing (Once Services Are Running)

```bash
# Via Gateway (recommended)
curl http://localhost:8080/api/users
curl http://localhost:8080/api/auth/login
curl http://localhost:8080/api/notifications

# Direct to service (bypass gateway)
curl http://localhost:8081/api/users
```

## Route Configuration

Routes are configured in Config Server at `config-repo/api-gateway.yml`:

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/users/**
        
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/api/auth/**
```

## Key Features

| Feature | Status |
|---------|--------|
| Dynamic Routing | ✅ |
| Load Balancing | ✅ |
| Service Discovery | ✅ |
| Circuit Breaker | ✅ |
| Request Logging | ✅ |
| Correlation IDs | ✅ |
| Config from Server | ✅ |
| Fallback Handling | ✅ |

## Filters

### Global Filters (Applied to All Routes)

1. **LoggingFilter** - Logs all requests with timing
2. **CorrelationIdFilter** - Adds X-Correlation-ID and X-Request-ID

### Headers Added to Requests

- `X-Correlation-ID` - Tracks request across services
- `X-Request-ID` - Unique ID for this request

## Circuit Breaker

When a service is down:

```json
{
  "success": false,
  "message": "Service temporarily unavailable. Please try again later.",
  "errorCode": "SERVICE_UNAVAILABLE",
  "statusCode": 503
}
```

## Testing Circuit Breaker

```bash
# 1. Stop a microservice
# 2. Make request through gateway
curl http://localhost:8080/api/users

# Should return fallback response (503)
```

## Testing Load Balancing

```bash
# 1. Start multiple instances of same service
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8091"

# 2. Make multiple requests
for i in {1..10}; do 
  curl http://localhost:8080/api/users
done

# Requests should distribute across instances
```

## Port Allocation

- **8761**: Discovery Service ← Must run FIRST
- **8888**: Config Server ← Must run SECOND  
- **8080**: API Gateway ← YOU ARE HERE
- **8081**: User Service
- **8082**: Auth Service
- **8083**: Notification Service

## Startup Order

```
1. Discovery Service (8761)
   ↓
2. Config Server (8888)
   ↓
3. API Gateway (8080)  ← Start this
   ↓
4. Microservices (8081+)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Gateway won't start | Check Discovery (8761) and Config (8888) are running |
| 404 on routes | Service not registered in Eureka, check http://localhost:8761 |
| Fallback triggered | Target service is down or unhealthy |
| Port 8080 in use | Stop other apps on 8080 or change port |

## Useful URLs

| URL | Purpose |
|-----|---------|
| http://localhost:8080/ | Gateway root |
| http://localhost:8080/actuator/health | Health check |
| http://localhost:8080/actuator/gateway/routes | View routes |
| http://localhost:8761 | Eureka dashboard |
| http://localhost:8888/api-gateway/dev | Gateway config |

## Request Flow

```
Client
  ↓
API Gateway (8080)
  ↓
LoggingFilter → CorrelationIdFilter
  ↓
Route Matching
  ↓
Circuit Breaker
  ↓
Load Balancer
  ↓
Target Service (8081+)
```

## Common Patterns

### Adding New Route

1. Edit Config Server: `config-repo/api-gateway.yml`
```yaml
- id: order-service
  uri: lb://order-service
  predicates:
    - Path=/api/orders/**
```

2. Refresh Gateway:
```bash
curl -X POST http://localhost:8080/actuator/refresh
```

### Route with Filters

```yaml
- id: user-service
  uri: lb://user-service
  predicates:
    - Path=/api/users/**
  filters:
    - AddRequestHeader=X-Source, gateway
    - StripPrefix=1
```

---

**Status**: ✅ Ready to use  
**Access**: http://localhost:8080  
**Next**: Build your microservices!
