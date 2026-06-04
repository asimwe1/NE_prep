# Spring Cloud Config Server

Centralized configuration management for all microservices in the system.

## Overview

The Config Server provides a centralized place to manage external properties for applications across all environments. Instead of having configuration files in each microservice, all configurations are stored here and fetched by services at startup.

## Features

✅ **Centralized Management** - All configurations in one place  
✅ **Environment-Specific** - Different configs for dev, test, prod  
✅ **Dynamic Refresh** - Update configs without restarting services  
✅ **Service Discovery Integration** - Registered with Eureka  
✅ **Security** - Optional encryption for sensitive properties  
✅ **Git Backend Support** - Version control for configurations  
✅ **Native Backend** - Local filesystem for simple setups

## Quick Start

### 1. Start Discovery Service First

```bash
cd discovery-service
mvn spring-boot:run
```

### 2. Start Config Server

```bash
cd config-server
mvn spring-boot:run
```

### 3. Verify Config Server

Check health: http://localhost:8888/actuator/health

## Accessing Configurations

### URL Pattern

```
http://localhost:8888/{application}/{profile}
http://localhost:8888/{application}/{profile}/{label}
```

### Examples

```bash
# Get user-service default configuration
curl http://localhost:8888/user-service/default

# Get user-service dev configuration
curl http://localhost:8888/user-service/dev

# Get user-service prod configuration
curl http://localhost:8888/user-service/prod

# Get auth-service dev configuration
curl http://localhost:8888/auth-service/dev
```

### Response Format

```json
{
  "name": "user-service",
  "profiles": ["dev"],
  "label": null,
  "version": null,
  "state": null,
  "propertySources": [
    {
      "name": "classpath:/config-repo/user-service-dev.yml",
      "source": {
        "spring.datasource.url": "jdbc:postgresql://localhost:5432/userdb_dev",
        "spring.datasource.username": "dev_user"
      }
    }
  ]
}
```

## Configuration Repository Structure

```
config-repo/
├── application.yml              # Common config for ALL services
├── user-service.yml             # User service default config
├── user-service-dev.yml         # User service dev config
├── user-service-prod.yml        # User service prod config
├── auth-service.yml             # Auth service default config
├── auth-service-dev.yml         # Auth service dev config
├── notification-service.yml     # Notification service default config
└── api-gateway.yml              # API Gateway config
```

### Configuration Hierarchy

Configurations are loaded in this order (later overrides earlier):

1. `application.yml` - Common to all services
2. `application-{profile}.yml` - Profile-specific common config
3. `{service-name}.yml` - Service-specific default config
4. `{service-name}-{profile}.yml` - Service and profile-specific config

## Client Configuration

### Step 1: Add Config Client Dependency

Add to your microservice's `pom.xml`:

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

### Step 2: Create bootstrap.yml

Create `src/main/resources/bootstrap.yml` in your microservice:

```yaml
spring:
  application:
    name: user-service  # Must match config file name
  
  cloud:
    config:
      uri: http://localhost:8888
      fail-fast: true
      retry:
        initial-interval: 1000
        max-attempts: 6
        max-interval: 2000
  
  profiles:
    active: dev  # or prod, test, etc.
```

### Step 3: Run Your Service

```bash
cd user-service
mvn spring-boot:run
```

The service will:
1. Connect to Config Server (http://localhost:8888)
2. Fetch configuration for `user-service` with `dev` profile
3. Apply configurations before starting

## Dynamic Configuration Refresh

### Enable Refresh in Client

Add to your microservice:

```java
@RestController
@RefreshScope  // Allows dynamic refresh
public class UserController {
    
    @Value("${app.name}")
    private String appName;
    
    @GetMapping("/info")
    public String getInfo() {
        return "App Name: " + appName;
    }
}
```

### Refresh Configuration

1. Update configuration in config-repo
2. Trigger refresh:

```bash
curl -X POST http://localhost:8081/actuator/refresh
```

The service will reload configurations without restarting!

## Using Git Backend

### Step 1: Update Config Server

Modify `application.yml`:

```yaml
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/your-org/config-repo
          default-label: main
          clone-on-start: true
          username: ${GIT_USERNAME}
          password: ${GIT_PASSWORD}
  profiles:
    active: git  # Change from 'native' to 'git'
```

### Step 2: Create Git Repository

```bash
git init config-repo
cd config-repo
# Add your configuration files
git add .
git commit -m "Initial configuration"
git remote add origin https://github.com/your-org/config-repo.git
git push -u origin main
```

### Benefits of Git Backend

- ✅ Version control for configurations
- ✅ Audit trail (who changed what, when)
- ✅ Easy rollback to previous versions
- ✅ Branch-based configurations (dev, staging, prod)
- ✅ Pull request workflow for config changes

## Encrypting Sensitive Properties

### Step 1: Install JCE

Download and install Java Cryptography Extension (JCE) Unlimited Strength.

### Step 2: Configure Encryption Key

Add to `bootstrap.yml`:

```yaml
encrypt:
  key: MySecretEncryptionKey123!
```

### Step 3: Encrypt Values

```bash
curl http://localhost:8888/encrypt -d "my-secret-password"
```

Response: `{cipher}AQCEhd3v5...encrypted_value...`

### Step 4: Use Encrypted Values

In configuration files:

```yaml
spring:
  datasource:
    password: '{cipher}AQCEhd3v5...encrypted_value...'
```

Config Server automatically decrypts when serving to clients.

## Configuration Examples

### Database Configuration

```yaml
# user-service-dev.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/userdb_dev
    username: dev_user
    password: '{cipher}encrypted_password'
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
```

### JWT Configuration

```yaml
# auth-service.yml
jwt:
  secret: ${JWT_SECRET:default-secret-key}
  access-token:
    expiration: 900000      # 15 minutes
  refresh-token:
    expiration: 604800000   # 7 days
```

### Email Configuration

```yaml
# notification-service.yml
mail:
  host: ${MAIL_HOST:smtp.gmail.com}
  port: ${MAIL_PORT:587}
  username: ${MAIL_USERNAME}
  password: '{cipher}encrypted_mail_password'
  properties:
    mail:
      smtp:
        auth: true
        starttls:
          enable: true
```

## Troubleshooting

### Config Server Not Starting

**Problem**: Failed to start ConfigServerApplication

**Solutions**:
1. Ensure Discovery Service is running on port 8761
2. Check port 8888 is not in use
3. Verify config-repo directory exists

### Client Can't Connect to Config Server

**Problem**: Service fails to start with config connection error

**Solutions**:
1. Verify Config Server is running: http://localhost:8888/actuator/health
2. Check `bootstrap.yml` has correct `spring.cloud.config.uri`
3. Ensure `spring.application.name` matches config file name
4. Check network connectivity

### Configuration Not Loading

**Problem**: Service doesn't see expected configuration

**Solutions**:
1. Verify file name matches service name: `user-service.yml` for `spring.application.name: user-service`
2. Check profile is set correctly
3. Test config endpoint directly: `http://localhost:8888/user-service/dev`
4. Check configuration hierarchy and overrides

### Refresh Not Working

**Problem**: `/actuator/refresh` doesn't update values

**Solutions**:
1. Add `@RefreshScope` to classes using `@Value`
2. Ensure `management.endpoints.web.exposure.include` includes `refresh`
3. Restart service if refresh still doesn't work

## Best Practices

1. **Naming Convention**
   - Use lowercase with hyphens: `user-service.yml`
   - Match `spring.application.name` exactly

2. **Sensitive Data**
   - Always encrypt passwords, tokens, API keys
   - Use environment variables for production secrets

3. **Default Values**
   - Provide defaults using `${VAR:default}`
   - Put common configs in `application.yml`

4. **Version Control**
   - Use Git backend for production
   - Review config changes via pull requests

5. **Documentation**
   - Comment configuration files
   - Document expected environment variables

6. **Testing**
   - Test config loading before deployment
   - Verify profile-specific configs

## Monitoring

### Health Check

```bash
curl http://localhost:8888/actuator/health
```

### View Environment

```bash
curl http://localhost:8888/actuator/env
```

### Metrics

```bash
curl http://localhost:8888/actuator/metrics
```

## Port Reference

- **8761**: Discovery Service (Eureka)
- **8888**: Config Server
- **8080**: API Gateway (next phase)
- **8081+**: Microservices

## Startup Order

1. **First**: Discovery Service (8761)
2. **Second**: Config Server (8888)
3. **Third**: API Gateway (8080)
4. **Finally**: Microservices (8081+)

---

**Status**: ✅ Ready for Development  
**Next**: Configure your microservices to use Config Server!
