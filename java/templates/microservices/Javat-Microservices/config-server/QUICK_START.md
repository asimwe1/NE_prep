# Config Server - Quick Start

## TL;DR

```bash
# Start Discovery Service first
cd discovery-service
mvn spring-boot:run

# Start Config Server
cd config-server
mvn spring-boot:run

# Test Configuration
curl http://localhost:8888/user-service/dev
```

## Build Commands

```bash
# Build
mvn clean package

# Run
mvn spring-boot:run

# Run with specific profile
mvn spring-boot:run -Dspring-boot.run.profiles=native

# Build Docker image
docker build -t config-server:1.0.0 .

# Run in Docker
docker run -p 8888:8888 config-server:1.0.0
```

## Test Configuration Endpoints

```bash
# Get user-service dev configuration
curl http://localhost:8888/user-service/dev

# Get user-service prod configuration
curl http://localhost:8888/user-service/prod

# Get auth-service dev configuration
curl http://localhost:8888/auth-service/dev

# Get common configuration (application.yml)
curl http://localhost:8888/application/default

# Get configuration in YAML format
curl -H "Accept: application/yaml" http://localhost:8888/user-service/dev
```

## Client Integration (Minimal)

### 1. Add Dependencies (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-config</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-bootstrap</artifactId>
</dependency>
```

### 2. Create bootstrap.yml

```yaml
spring:
  application:
    name: user-service
  cloud:
    config:
      uri: http://localhost:8888
  profiles:
    active: dev
```

### 3. Create Config File

Create `config-repo/user-service-dev.yml` in Config Server:

```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/userdb
    username: user
    password: password
```

### 4. Run Service

```bash
cd user-service
mvn spring-boot:run
```

## Configuration Repository Structure

```
config-repo/
├── application.yml               # Common for ALL services
├── user-service.yml              # User service default
├── user-service-dev.yml          # User service dev
├── user-service-prod.yml         # User service prod
├── auth-service.yml              # Auth service default
├── auth-service-dev.yml          # Auth service dev
├── notification-service.yml      # Notification default
└── api-gateway.yml               # Gateway config
```

## Dynamic Refresh

### Enable Refresh in Controller

```java
@RestController
@RefreshScope
public class MyController {
    @Value("${app.name}")
    private String appName;
}
```

### Trigger Refresh

```bash
# Update config in config-repo, then:
curl -X POST http://localhost:8081/actuator/refresh
```

## Configuration Hierarchy

Properties load in order (later overrides earlier):

1. `application.yml` (common)
2. `user-service.yml` (service-specific)
3. `application-dev.yml` (common + profile)
4. `user-service-dev.yml` (service + profile)

## Encrypt Sensitive Properties

```bash
# Encrypt value
curl http://localhost:8888/encrypt -d "my-secret"

# Output: AQCEhd3v5...encrypted...

# Use in config file
password: '{cipher}AQCEhd3v5...encrypted...'
```

## Useful Endpoints

| Endpoint | Description |
|----------|-------------|
| http://localhost:8888/actuator/health | Health check |
| http://localhost:8888/actuator/env | Environment properties |
| http://localhost:8888/{app}/{profile} | Get configuration |
| http://localhost:8888/encrypt | Encrypt value (POST) |
| http://localhost:8888/decrypt | Decrypt value (POST) |

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| Service can't connect | Check Config Server is running on 8888 |
| Config not loading | Verify `spring.application.name` matches file name |
| Wrong profile | Check `spring.profiles.active` in bootstrap.yml |
| Properties not updating | Use `/actuator/refresh` or restart service |

## Port Allocation

- **8761**: Discovery Service ← Start FIRST
- **8888**: Config Server ← Start SECOND
- **8080**: API Gateway
- **8081**: User Service
- **8082**: Auth Service
- **8083**: Notification Service

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

## Verification Checklist

After starting Config Server:

- [ ] Health check returns UP: http://localhost:8888/actuator/health
- [ ] Registered in Eureka: http://localhost:8761
- [ ] Can fetch config: http://localhost:8888/user-service/dev
- [ ] Config files exist in config-repo/

After starting client service:

- [ ] Service logs show "Fetching config from server"
- [ ] Service logs show "Located environment"
- [ ] Properties are loaded correctly
- [ ] Service appears in Eureka

## Common Patterns

### Database Configuration

```yaml
# user-service-dev.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/db
    username: ${DB_USER:user}
    password: ${DB_PASS:pass}
```

### Feature Toggles

```yaml
# user-service-dev.yml
features:
  new-ui: true
  beta-api: false
  maintenance-mode: false
```

```java
@Value("${features.new-ui}")
private boolean newUiEnabled;
```

### External API Configuration

```yaml
# notification-service.yml
external:
  email-api:
    url: ${EMAIL_API_URL}
    api-key: '{cipher}encrypted_key'
    timeout: 5000
```

---

**Status**: ✅ Ready to use  
**Server**: http://localhost:8888  
**Next**: Configure your microservices!
