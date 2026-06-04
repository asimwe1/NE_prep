# Eureka Discovery Service

Netflix Eureka Service Discovery Server for microservices architecture.

## Overview

The Discovery Service is a centralized service registry where all microservices register themselves and discover other services. This enables:
- **Service Registration**: Services automatically register on startup
- **Service Discovery**: Services can find each other by name
- **Load Balancing**: Client-side load balancing through Ribbon
- **Health Checking**: Automatic detection of unhealthy instances
- **Dynamic Routing**: API Gateway can route based on service registry

## Features

✅ **Service Registry** - Central repository of all service instances  
✅ **Self-Preservation Mode** - Protects against network partitions in production  
✅ **Health Monitoring** - Automatic health checks via heartbeats  
✅ **Web Dashboard** - Visual interface to monitor registered services  
✅ **REST API** - Programmatic access to registry information  
✅ **Multi-Profile Support** - Different configs for dev/prod environments

## Quick Start

### 1. Run the Discovery Service

```bash
cd discovery-service
mvn spring-boot:run
```

### 2. Access the Dashboard

Open browser: **http://localhost:8761**

You'll see:
- Registered instances
- Service status
- Health information
- System stats

### 3. Register a Client Service

Add to your microservice's `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

Add to your microservice's `application.yml`:

```yaml
spring:
  application:
    name: user-service  # Service name

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
    register-with-eureka: true
    fetch-registry: true
  instance:
    prefer-ip-address: true
    instance-id: ${spring.application.name}:${random.value}
```

Add `@EnableDiscoveryClient` to your main application class:

```java
@SpringBootApplication
@EnableDiscoveryClient
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

## Configuration

### Default Configuration (Development)

- **Port**: 8761
- **Self-Preservation**: Disabled
- **Eviction Interval**: 10 seconds
- **Dashboard**: http://localhost:8761

### Production Configuration

Activate with: `--spring.profiles.active=prod`

- **Self-Preservation**: Enabled
- **Eviction Interval**: 60 seconds
- **Security**: Can be enabled (see below)

## Eureka Configuration Explained

```yaml
eureka:
  client:
    register-with-eureka: false  # Server doesn't register itself
    fetch-registry: false         # Server doesn't fetch registry
    
  server:
    enable-self-preservation: false  # Disable in dev, enable in prod
    eviction-interval-timer-in-ms: 10000  # How often to check for expired services
    response-cache-update-interval-ms: 5000  # Cache update interval
```

### Self-Preservation Mode

**Development**: Disabled for faster feedback during development  
**Production**: Enabled to prevent mass de-registration during network issues

When enabled, Eureka won't evict services if renewal rate drops below threshold.

## Service Discovery Pattern

### How It Works

1. **Service Registration**
   - Microservice starts up
   - Registers itself with Eureka (hostname, port, health check URL)
   - Sends heartbeats every 30 seconds (default)

2. **Service Discovery**
   - Client queries Eureka for service instances
   - Gets list of healthy instances
   - Caches locally for performance
   - Refreshes cache periodically

3. **Service Communication**
   - Client uses service name (not hardcoded URL)
   - Load balancer selects instance
   - Makes HTTP call to selected instance

### Example: Service-to-Service Call

```java
@Service
public class OrderService {
    
    @Autowired
    private RestTemplate restTemplate;  // Load-balanced RestTemplate
    
    public UserDTO getUser(Long userId) {
        // Using service name instead of hardcoded URL
        String url = "http://user-service/api/users/" + userId;
        return restTemplate.getForObject(url, UserDTO.class);
    }
}

// Configuration
@Configuration
public class RestTemplateConfig {
    
    @Bean
    @LoadBalanced  // Enables service discovery
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
```

## Securing Eureka Dashboard

To enable basic authentication:

1. Uncomment Spring Security dependency in `pom.xml`

2. Add to `application-prod.yml`:

```yaml
spring:
  security:
    user:
      name: admin
      password: ${EUREKA_PASSWORD:changeme}
```

3. Update client services to use credentials:

```yaml
eureka:
  client:
    service-url:
      defaultZone: http://admin:changeme@localhost:8761/eureka/
```

## Monitoring & Health Checks

### Actuator Endpoints

- **Health**: http://localhost:8761/actuator/health
- **Info**: http://localhost:8761/actuator/info
- **Metrics**: http://localhost:8761/actuator/metrics

### Eureka REST API

- **All Instances**: http://localhost:8761/eureka/apps
- **Specific Service**: http://localhost:8761/eureka/apps/USER-SERVICE
- **Instance Details**: http://localhost:8761/eureka/apps/USER-SERVICE/instance-id

## High Availability Setup

For production, run multiple Eureka servers:

### Eureka Server 1
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://eureka-server-2:8761/eureka/
```

### Eureka Server 2
```yaml
eureka:
  client:
    service-url:
      defaultZone: http://eureka-server-1:8761/eureka/
```

Servers replicate state between each other.

## Troubleshooting

### Services Not Appearing

1. **Check service is running**: Verify service started successfully
2. **Check Eureka URL**: Ensure `defaultZone` is correct
3. **Check network**: Ensure services can reach Eureka server
4. **Check logs**: Look for registration errors

### Services Showing as DOWN

1. **Health check failing**: Verify `/actuator/health` endpoint
2. **Heartbeat timeout**: Service may be too slow to respond
3. **Network issues**: Firewall blocking heartbeats

### Self-Preservation Mode Warning

```
EMERGENCY! EUREKA MAY BE INCORRECTLY CLAIMING INSTANCES ARE UP WHEN THEY'RE NOT.
```

This is normal in development when few services are registered. Disable with:
```yaml
eureka:
  server:
    enable-self-preservation: false
```

## Best Practices

1. **Use Instance IDs**: Include random value for multiple instances
   ```yaml
   instance-id: ${spring.application.name}:${random.value}
   ```

2. **Prefer IP Address**: Useful in containerized environments
   ```yaml
   prefer-ip-address: true
   ```

3. **Health Checks**: Ensure `/actuator/health` is accessible

4. **Timeouts**: Configure appropriate timeouts for your environment

5. **Caching**: Balance freshness vs performance with cache settings

## Docker Support

### Dockerfile

```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/discovery-service-1.0.0.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose

```yaml
services:
  discovery-service:
    build: ./discovery-service
    ports:
      - "8761:8761"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    networks:
      - microservices-network
```

## Next Steps

After setting up Discovery Service:
1. ✅ **Config Server** - Centralized configuration management
2. ✅ **API Gateway** - Single entry point with routing
3. ✅ **Microservices** - User, Auth, Notification services

## Port Reference

- **Discovery Service**: 8761
- **Config Server**: 8888 (next)
- **API Gateway**: 8080 (next)
- **Microservices**: 8081+ (next)

---

**Status**: ✅ Ready for Development

Start this service first before starting any microservices!
