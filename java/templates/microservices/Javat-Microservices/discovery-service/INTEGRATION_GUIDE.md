# Discovery Service Integration Guide

## How to Integrate Microservices with Eureka

This guide shows how to register your microservices with the Discovery Service.

## Step 1: Add Eureka Client Dependency

Add to your microservice's `pom.xml`:

```xml
<dependencies>
    <!-- Eureka Discovery Client -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
</dependencies>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>2023.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

## Step 2: Enable Discovery Client

Add `@EnableDiscoveryClient` to your main application class:

```java
package com.microservices.userservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
```

## Step 3: Configure Eureka Client

Add to your microservice's `application.yml`:

```yaml
spring:
  application:
    name: user-service  # IMPORTANT: This is how other services will find you

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
    register-with-eureka: true
    fetch-registry: true
    registry-fetch-interval-seconds: 30
  instance:
    prefer-ip-address: true
    lease-renewal-interval-in-seconds: 30
    lease-expiration-duration-in-seconds: 90
    instance-id: ${spring.application.name}:${spring.application.instance_id:${random.value}}
```

### Configuration Explained

| Property | Description | Recommended Value |
|----------|-------------|-------------------|
| `spring.application.name` | Unique service identifier | `user-service`, `auth-service`, etc. |
| `defaultZone` | Eureka server URL | `http://localhost:8761/eureka/` |
| `register-with-eureka` | Register this service | `true` |
| `fetch-registry` | Fetch other services | `true` |
| `prefer-ip-address` | Use IP instead of hostname | `true` (especially in Docker) |
| `instance-id` | Unique instance identifier | Include random value for multiple instances |
| `lease-renewal-interval-in-seconds` | Heartbeat interval | `30` (default) |
| `lease-expiration-duration-in-seconds` | Time before marked as DOWN | `90` (default) |

## Step 4: Test Registration

1. **Start Discovery Service**
   ```bash
   cd discovery-service
   mvn spring-boot:run
   ```

2. **Start Your Microservice**
   ```bash
   cd user-service
   mvn spring-boot:run
   ```

3. **Verify Registration**
   - Open: http://localhost:8761
   - You should see your service listed under "Instances currently registered with Eureka"

## Service-to-Service Communication

### Option 1: Load-Balanced RestTemplate (Recommended for Simple Cases)

```java
@Configuration
public class RestTemplateConfig {
    
    @Bean
    @LoadBalanced  // Enable service discovery and load balancing
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

@Service
public class OrderService {
    
    @Autowired
    private RestTemplate restTemplate;
    
    public UserDTO getUser(Long userId) {
        // Use service name instead of hardcoded URL
        String url = "http://user-service/api/users/" + userId;
        return restTemplate.getForObject(url, UserDTO.class);
    }
}
```

### Option 2: WebClient (Recommended for Reactive Applications)

```java
@Configuration
public class WebClientConfig {
    
    @Bean
    @LoadBalanced
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}

@Service
public class OrderService {
    
    private final WebClient webClient;
    
    public OrderService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }
    
    public Mono<UserDTO> getUser(Long userId) {
        return webClient.get()
                .uri("http://user-service/api/users/{id}", userId)
                .retrieve()
                .bodyToMono(UserDTO.class);
    }
}
```

### Option 3: OpenFeign (Recommended for Multiple Service Calls)

Add dependency:
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
```

Enable Feign:
```java
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class OrderServiceApplication {
    // ...
}
```

Create Feign client:
```java
@FeignClient(name = "user-service")
public interface UserServiceClient {
    
    @GetMapping("/api/users/{id}")
    UserDTO getUser(@PathVariable("id") Long id);
    
    @GetMapping("/api/users")
    List<UserDTO> getAllUsers();
    
    @PostMapping("/api/users")
    UserDTO createUser(@RequestBody CreateUserRequest request);
}
```

Use in service:
```java
@Service
public class OrderService {
    
    @Autowired
    private UserServiceClient userServiceClient;
    
    public UserDTO getUser(Long userId) {
        return userServiceClient.getUser(userId);
    }
}
```

## Health Checks

Ensure your microservice has health check endpoint:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: always
```

## Multiple Instances

To run multiple instances of the same service:

### Instance 1
```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8081"
```

### Instance 2
```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8082"
```

Both will register with Eureka and load balancing will distribute requests.

## Docker Configuration

```yaml
# docker-compose.yml
services:
  discovery-service:
    build: ./discovery-service
    ports:
      - "8761:8761"
    networks:
      - microservices-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8761/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  user-service:
    build: ./user-service
    environment:
      - EUREKA_CLIENT_SERVICEURL_DEFAULTZONE=http://discovery-service:8761/eureka/
      - SPRING_APPLICATION_NAME=user-service
    depends_on:
      - discovery-service
    networks:
      - microservices-network

networks:
  microservices-network:
    driver: bridge
```

## Troubleshooting

### Service Not Registering

**Problem**: Service doesn't appear in Eureka dashboard

**Solutions**:
1. Check `spring.application.name` is set
2. Verify `defaultZone` URL is correct
3. Check network connectivity to Eureka server
4. Look for errors in service logs
5. Ensure `@EnableDiscoveryClient` is present

### Service Marked as DOWN

**Problem**: Service shows RED in Eureka dashboard

**Solutions**:
1. Check health endpoint: `http://localhost:port/actuator/health`
2. Verify firewall isn't blocking heartbeats
3. Check service logs for errors
4. Ensure adequate CPU/memory resources

### Service Discovery Not Working

**Problem**: Can't call service by name (http://user-service/api/...)

**Solutions**:
1. Ensure `@LoadBalanced` on RestTemplate/WebClient
2. Check `fetch-registry: true` in configuration
3. Wait 30-60 seconds for registry refresh
4. Verify both services are registered in Eureka

### "Request execution error. endpoint=DefaultEndpoint"

**Problem**: Can't connect to Eureka server

**Solutions**:
1. Verify Eureka server is running
2. Check `defaultZone` URL format
3. Check network connectivity
4. Try: `http://localhost:8761/eureka/` (note the /eureka/ suffix)

## Best Practices

1. **Meaningful Service Names**
   - Use lowercase with hyphens: `user-service`, `auth-service`
   - Match your microservice's purpose

2. **Health Checks**
   - Always include Spring Boot Actuator
   - Implement custom health indicators for dependencies

3. **Instance IDs**
   - Include random value for multiple instances
   - Format: `service-name:random-value`

4. **Timeouts**
   - Set appropriate connection and read timeouts
   - Consider circuit breakers (Resilience4j)

5. **Graceful Shutdown**
   ```yaml
   server:
     shutdown: graceful
   spring:
     lifecycle:
       timeout-per-shutdown-phase: 30s
   ```

6. **Metadata**
   ```yaml
   eureka:
     instance:
       metadata-map:
         version: 1.0.0
         environment: dev
   ```

## Next Steps

After integrating with Discovery Service:

1. ✅ **Config Server** - Centralized configuration
2. ✅ **API Gateway** - Single entry point with routing
3. ✅ **Circuit Breakers** - Resilience4j for fault tolerance
4. ✅ **Distributed Tracing** - Zipkin for request tracing

---

**Remember**: Always start Discovery Service BEFORE starting your microservices!
