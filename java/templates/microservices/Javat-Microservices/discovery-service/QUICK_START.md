# Discovery Service - Quick Start

## TL;DR

```bash
# Start Discovery Service
cd discovery-service
mvn spring-boot:run

# Open Dashboard
http://localhost:8761
```

## Build Commands

```bash
# Clean and build
mvn clean package

# Run without building
mvn spring-boot:run

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=prod

# Build Docker image
docker build -t discovery-service:1.0.0 .

# Run in Docker
docker run -p 8761:8761 discovery-service:1.0.0
```

## Client Configuration (Minimal)

### Add to pom.xml
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

### Add to application.yml
```yaml
spring:
  application:
    name: your-service-name

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

### Add to main class
```java
@SpringBootApplication
@EnableDiscoveryClient
public class YourServiceApplication { }
```

## Service-to-Service Call (Minimal)

```java
@Configuration
public class Config {
    @Bean
    @LoadBalanced
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}

@Service
public class YourService {
    @Autowired
    private RestTemplate restTemplate;
    
    public void callOtherService() {
        String result = restTemplate.getForObject(
            "http://other-service-name/api/endpoint",
            String.class
        );
    }
}
```

## Useful Endpoints

| Endpoint | Description |
|----------|-------------|
| http://localhost:8761 | Eureka Dashboard |
| http://localhost:8761/eureka/apps | All registered services (XML) |
| http://localhost:8761/eureka/apps/USER-SERVICE | Specific service info |
| http://localhost:8761/actuator/health | Health check |

## Verification Checklist

After starting your microservice:

- [ ] Service appears in Eureka dashboard (http://localhost:8761)
- [ ] Status is **UP** (green)
- [ ] Instance ID is visible
- [ ] Health check URL is accessible

## Common Issues

| Issue | Solution |
|-------|----------|
| Service not showing | Check `spring.application.name` is set |
| Service DOWN | Check `/actuator/health` endpoint |
| Can't call by name | Add `@LoadBalanced` to RestTemplate |
| Connection refused | Verify Eureka is running on port 8761 |

## Port Allocation

- **8761**: Discovery Service (Eureka)
- **8888**: Config Server (next phase)
- **8080**: API Gateway (next phase)
- **8081+**: Your microservices

## Startup Order

1. **First**: Discovery Service (8761)
2. **Second**: Config Server (8888) - if using
3. **Third**: API Gateway (8080) - if using
4. **Finally**: Your microservices

---

**Status**: ✅ Ready to use  
**Dashboard**: http://localhost:8761  
**Next**: Integrate your first microservice!
