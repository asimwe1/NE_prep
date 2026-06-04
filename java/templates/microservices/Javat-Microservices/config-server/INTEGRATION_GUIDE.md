# Config Server Integration Guide

## How to Configure Microservices to Use Config Server

This guide shows step-by-step how to integrate your microservices with the Config Server.

## Prerequisites

- Discovery Service running on port 8761
- Config Server running on port 8888

## Step 1: Add Config Client Dependencies

Add to your microservice's `pom.xml`:

```xml
<dependencies>
    <!-- Spring Cloud Config Client -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-config</artifactId>
    </dependency>
    
    <!-- Bootstrap support (required for config client) -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-bootstrap</artifactId>
    </dependency>
    
    <!-- Eureka Discovery Client -->
    <dependency>
        <groupId>org.springframework.cloud</groupId>
        <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
    </dependency>
    
    <!-- Actuator (for /actuator/refresh endpoint) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
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

## Step 2: Create bootstrap.yml

Create `src/main/resources/bootstrap.yml` (this loads BEFORE application.yml):

```yaml
spring:
  application:
    name: user-service  # MUST match config file name in config-repo
  
  cloud:
    config:
      # Config Server URL
      uri: http://localhost:8888
      
      # Fail fast if can't connect to config server
      fail-fast: true
      
      # Retry configuration
      retry:
        initial-interval: 1000
        max-attempts: 6
        max-interval: 2000
        multiplier: 1.1
  
  profiles:
    active: dev  # Load user-service-dev.yml from config server
```

### Alternative: Service Discovery-Based Config

If Config Server is registered with Eureka:

```yaml
spring:
  application:
    name: user-service
  
  cloud:
    config:
      discovery:
        enabled: true
        service-id: config-server
      fail-fast: true
  
  profiles:
    active: dev

eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
```

## Step 3: Minimal application.yml

Keep `src/main/resources/application.yml` minimal (most config comes from Config Server):

```yaml
# application.yml (local overrides only)

# Only put properties that should NOT be centralized
# Everything else should be in Config Server
```

## Step 4: Create Configuration in Config Server

Create `config-repo/user-service.yml` in Config Server:

```yaml
# user-service.yml (default configuration)
spring:
  application:
    name: user-service

server:
  port: 8081

app:
  name: User Service
  version: 1.0.0
```

Create `config-repo/user-service-dev.yml`:

```yaml
# user-service-dev.yml (development configuration)
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/userdb_dev
    username: dev_user
    password: dev_password
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

logging:
  level:
    com.microservices.userservice: DEBUG
```

## Step 5: Enable Discovery Client

Add to your main application class:

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

## Step 6: Test Configuration Loading

### Start Services in Order

```bash
# 1. Start Discovery Service
cd discovery-service
mvn spring-boot:run

# 2. Start Config Server
cd config-server
mvn spring-boot:run

# 3. Start Your Microservice
cd user-service
mvn spring-boot:run
```

### Verify Configuration

Check service logs for:
```
Fetching config from server at : http://localhost:8888
Located environment: name=user-service, profiles=[dev]
```

## Dynamic Configuration Refresh

### Enable Refresh Scope

Add `@RefreshScope` to beans that should reload:

```java
@RestController
@RefreshScope  // Enables dynamic refresh
public class UserController {
    
    @Value("${app.name}")
    private String appName;
    
    @Value("${app.version}")
    private String version;
    
    @GetMapping("/info")
    public Map<String, String> getInfo() {
        return Map.of(
            "name", appName,
            "version", version
        );
    }
}
```

### Expose Refresh Endpoint

Add to `bootstrap.yml` or config-repo file:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,refresh
```

### Trigger Refresh

1. Update configuration in Config Server's config-repo
2. Trigger refresh without restarting:

```bash
curl -X POST http://localhost:8081/actuator/refresh
```

The service reloads configuration values!

## Configuration Profiles

### Using Multiple Profiles

```yaml
# bootstrap.yml
spring:
  profiles:
    active: dev,mysql  # Loads both dev and mysql profiles
```

This loads configurations in order:
1. `application.yml`
2. `user-service.yml`
3. `application-dev.yml`
4. `user-service-dev.yml`
5. `application-mysql.yml`
6. `user-service-mysql.yml`

### Profile-Specific Config Files

```
config-repo/
├── user-service.yml          # Default (all profiles)
├── user-service-dev.yml      # Development
├── user-service-test.yml     # Testing
├── user-service-prod.yml     # Production
├── user-service-docker.yml   # Docker-specific
└── user-service-k8s.yml      # Kubernetes-specific
```

## Configuration Priority

Configurations override in this order (highest priority last):

1. `application.yml` in config-repo (lowest priority)
2. `application-{profile}.yml` in config-repo
3. `{service-name}.yml` in config-repo
4. `{service-name}-{profile}.yml` in config-repo
5. `application.yml` in service (local)
6. Environment variables
7. Command-line arguments (highest priority)

## Using Environment Variables

In configuration files:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/db}
    username: ${DB_USER:default_user}
    password: ${DB_PASSWORD:default_password}
```

Format: `${ENV_VAR:default_value}`

## Encrypting Sensitive Properties

### Enable Encryption

Add to Config Server's `bootstrap.yml`:

```yaml
encrypt:
  key: MyVerySecretEncryptionKey123!
```

### Encrypt Property

```bash
curl http://localhost:8888/encrypt -d "my-secret-password"
```

Response: `AQCEhd3v5...encrypted_value...`

### Use Encrypted Value

```yaml
spring:
  datasource:
    password: '{cipher}AQCEhd3v5...encrypted_value...'
```

Config Server decrypts automatically when serving to clients.

## Testing Configuration

### Test Config Endpoint

```bash
# View configuration
curl http://localhost:8888/user-service/dev

# View in properties format
curl http://localhost:8888/user-service/dev/master

# View as YAML
curl -H "Accept: application/yaml" http://localhost:8888/user-service/dev
```

### Test from Service

```java
@RestController
public class ConfigTestController {
    
    @Autowired
    private Environment env;
    
    @GetMapping("/config-test")
    public Map<String, String> testConfig() {
        return Map.of(
            "datasource.url", env.getProperty("spring.datasource.url"),
            "app.name", env.getProperty("app.name"),
            "profile", String.join(",", env.getActiveProfiles())
        );
    }
}
```

## Troubleshooting

### Service Can't Connect to Config Server

**Error**: `Could not resolve placeholder 'some.property'`

**Solutions**:
1. Verify Config Server is running: `http://localhost:8888/actuator/health`
2. Check `bootstrap.yml` exists and has correct config server URI
3. Verify `spring.application.name` matches config file name
4. Check Config Server logs for errors

### Configuration Not Loading

**Error**: Properties have default values instead of config server values

**Solutions**:
1. Ensure `bootstrap.yml` loads before `application.yml`
2. Check profile is set correctly in `bootstrap.yml`
3. Test config endpoint: `http://localhost:8888/{service-name}/{profile}`
4. Check file naming: `user-service-dev.yml` not `user_service_dev.yml`

### Refresh Not Working

**Error**: `/actuator/refresh` doesn't update values

**Solutions**:
1. Add `@RefreshScope` to classes using `@Value`
2. Expose refresh endpoint in management configuration
3. Check if property is in a `@Configuration` class (these don't refresh automatically)
4. Consider restarting service if refresh doesn't work for specific property

## Complete Example

### bootstrap.yml
```yaml
spring:
  application:
    name: user-service
  cloud:
    config:
      uri: http://localhost:8888
      fail-fast: true
  profiles:
    active: dev
```

### Config Server: config-repo/user-service-dev.yml
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/userdb
    username: dev_user
    password: dev_pass

server:
  port: 8081

app:
  name: User Service
  max-users: 1000
```

### Service Code
```java
@RestController
@RefreshScope
public class UserController {
    
    @Value("${app.name}")
    private String appName;
    
    @Value("${app.max-users}")
    private int maxUsers;
    
    @Autowired
    private DataSource dataSource;  // Configured by config server
    
    @GetMapping("/info")
    public Map<String, Object> getInfo() {
        return Map.of(
            "appName", appName,
            "maxUsers", maxUsers,
            "datasourceUrl", dataSource.toString()
        );
    }
}
```

## Best Practices

1. **Use bootstrap.yml for config client settings** - Don't put config client settings in application.yml
2. **Fail fast in production** - Set `fail-fast: true` to catch config issues early
3. **Use profiles consistently** - dev, test, staging, prod
4. **Encrypt sensitive data** - Passwords, API keys, tokens
5. **Version control config-repo** - Use Git backend for audit trail
6. **Document expected properties** - Add comments in config files
7. **Test config changes** - Use refresh endpoint before deploying

---

**Next Steps**: Integrate all your microservices with Config Server!
