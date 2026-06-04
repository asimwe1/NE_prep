# Complete System Testing Guide

## Testing the Microservices Stack

This guide will help you test all services from infrastructure to auth-service.

---

## Step 1: Start Services in Order

### Terminal 1: Discovery Service (Port 8761)

```bash
cd o:\Projects\Templates\javat-microservices\discovery-service
mvn spring-boot:run
```

**Wait for**: `Started DiscoveryServiceApplication`

**Verify**:
```bash
curl http://localhost:8761/actuator/health
```

Expected: `{"status":"UP"}`

**Dashboard**: http://localhost:8761

---

### Terminal 2: Config Server (Port 8888)

**Wait 10 seconds after Discovery Service starts**

```bash
cd o:\Projects\Templates\javat-microservices\config-server
mvn spring-boot:run
```

**Wait for**: `Started ConfigServerApplication`

**Verify**:
```bash
# Health check
curl http://localhost:8761/actuator/health

# Test config retrieval
curl http://localhost:8888/auth-service/dev
```

Expected: JSON with auth-service configuration

---

### Terminal 3: API Gateway (Port 8080)

**Wait 10 seconds after Config Server starts**

```bash
cd o:\Projects\Templates\javat-microservices\api-gateway
mvn spring-boot:run
```

**Wait for**: `Started ApiGatewayApplication`

**Verify**:
```bash
# Health check
curl http://localhost:8080/actuator/health

# Root endpoint
curl http://localhost:8080/

# View routes
curl http://localhost:8080/actuator/gateway/routes
```

---

### Terminal 4: Auth Service (Port 8082)

**Wait 10 seconds after API Gateway starts**

```bash
cd o:\Projects\Templates\javat-microservices\auth-service
mvn spring-boot:run
```

**Wait for**: `Started AuthServiceApplication`

**Verify**:
```bash
# Health check
curl http://localhost:8082/actuator/health

# Auth service health
curl http://localhost:8082/api/auth/health
```

---

## Step 2: Verify Service Registration

### Check Eureka Dashboard

Open: http://localhost:8761

You should see these applications registered:
- ✅ **CONFIG-SERVER**
- ✅ **API-GATEWAY**
- ✅ **AUTH-SERVICE**

**Screenshot what you see!**

---

## Step 3: Test Auth Service Directly

### 3.1 Register a User

```bash
curl -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "tokenType": "Bearer",
    "expiresIn": 900000,
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "firstName": "Test",
      "lastName": "User",
      "roles": ["USER"]
    }
  }
}
```

**✅ Save the accessToken and refreshToken!**

---

### 3.2 Login

```bash
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser",
    "password": "Test123!@#"
  }'
```

**Expected**: Same response structure as registration

---

### 3.3 Refresh Token

```bash
curl -X POST http://localhost:8082/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

Replace `YOUR_REFRESH_TOKEN_HERE` with the refresh token from registration/login.

**Expected**: New access and refresh tokens

---

### 3.4 Logout

```bash
curl -X POST http://localhost:8082/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Expected**:
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": "Logged out successfully"
}
```

---

## Step 4: Test Via API Gateway

All auth endpoints should work through the gateway on port 8080:

### 4.1 Register via Gateway

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gatewayuser",
    "email": "gateway@example.com",
    "password": "Gateway123!",
    "confirmPassword": "Gateway123!",
    "firstName": "Gateway",
    "lastName": "User"
  }'
```

**Expected**: Same response as direct call

**Check Gateway Logs** for:
```
Incoming request: POST /api/auth/register from /127.0.0.1:...
Completed request: POST /api/auth/register - Status: 201 CREATED - Duration: XXXms
```

---

### 4.2 Login via Gateway

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "gatewayuser",
    "password": "Gateway123!"
  }'
```

---

## Step 5: Test Error Handling

### 5.1 Validation Error

```bash
curl -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab",
    "email": "invalid-email",
    "password": "weak",
    "confirmPassword": "different"
  }'
```

**Expected** (400 Bad Request):
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "statusCode": 400,
  "validationErrors": {
    "username": "Username must be between 3 and 50 characters",
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters...",
    "confirmPassword": "Passwords do not match"
  }
}
```

---

### 5.2 Duplicate Username

```bash
curl -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "another@example.com",
    "password": "Test123!@#",
    "confirmPassword": "Test123!@#"
  }'
```

**Expected** (409 Conflict):
```json
{
  "success": false,
  "message": "Username already exists",
  "errorCode": "USERNAME_EXISTS",
  "statusCode": 409
}
```

---

### 5.3 Invalid Login

```bash
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "testuser",
    "password": "WrongPassword123!"
  }'
```

**Expected** (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid username/email or password",
  "errorCode": "UNAUTHORIZED",
  "statusCode": 401
}
```

---

## Step 6: Test H2 Database (Dev Mode)

### Access H2 Console

**URL**: http://localhost:8082/h2-console

**Connection Settings**:
- JDBC URL: `jdbc:h2:mem:authdb`
- Username: `sa`
- Password: *(leave empty)*

**Click**: Connect

### View Users Table

```sql
SELECT * FROM users;
```

You should see the registered users.

### View User Roles

```sql
SELECT * FROM user_roles;
```

You should see roles assigned to users (default: USER).

### View Refresh Tokens

```sql
SELECT * FROM refresh_tokens;
```

You should see refresh tokens with expiry dates and device info.

---

## Step 7: Test Config Server Integration

### View Auth Service Config

```bash
curl http://localhost:8888/auth-service/dev
```

**Expected**: JSON with:
- spring.datasource configuration (H2)
- jwt.access-token.expiration
- logging configuration

---

### Verify Service Uses Config

Check auth-service logs for:
```
Fetching config from server at : http://localhost:8888
Located environment: name=auth-service, profiles=[dev]
```

---

## Step 8: Test Service Discovery

### List All Services

```bash
curl http://localhost:8761/eureka/apps
```

**Expected**: XML listing all registered services

### Get Specific Service

```bash
curl http://localhost:8761/eureka/apps/AUTH-SERVICE
```

**Expected**: XML with auth-service instances

---

## Step 9: Test Gateway Routing

### View All Gateway Routes

```bash
curl http://localhost:8080/actuator/gateway/routes
```

**Expected**: JSON array with routes including:
- id: `auth-service`
- uri: `lb://auth-service`
- predicates: `Path=/api/auth/**`

---

### Test Route Matching

The gateway should route these paths:

| Client Request | Routes To | Service Port |
|---------------|-----------|--------------|
| `http://localhost:8080/api/auth/login` | auth-service | 8082 |
| `http://localhost:8080/api/auth/register` | auth-service | 8082 |
| `http://localhost:8080/api/users/*` | user-service | 8081 (not running yet) |

---

## Step 10: Test Circuit Breaker

### Trigger Fallback

1. **Stop auth-service** (Ctrl+C in Terminal 4)

2. **Try to access via gateway**:
```bash
curl http://localhost:8080/api/auth/health
```

**Expected** (503 Service Unavailable):
```json
{
  "success": false,
  "message": "Service temporarily unavailable. Please try again later.",
  "errorCode": "SERVICE_UNAVAILABLE",
  "statusCode": 503
}
```

3. **Restart auth-service** and verify it works again

---

## Quick Test Script (Windows)

Save as `test-stack.bat`:

```batch
@echo off
echo ===================================
echo Testing Microservices Stack
echo ===================================

echo.
echo 1. Testing Discovery Service...
curl -s http://localhost:8761/actuator/health
echo.

echo 2. Testing Config Server...
curl -s http://localhost:8888/actuator/health
echo.

echo 3. Testing API Gateway...
curl -s http://localhost:8080/actuator/health
echo.

echo 4. Testing Auth Service...
curl -s http://localhost:8082/actuator/health
echo.

echo 5. Checking Eureka Registration...
echo Open: http://localhost:8761
echo.

echo ===================================
echo All services health checks complete!
echo ===================================
pause
```

Run: `test-stack.bat`

---

## Troubleshooting

### Service Won't Start

**Check**:
1. Previous service is running and healthy
2. Port is not already in use
3. No compilation errors (`mvn clean package`)
4. Check logs for stack traces

### Service Not Appearing in Eureka

**Check**:
1. Discovery Service is running (8761)
2. Service has `@EnableDiscoveryClient` annotation
3. `bootstrap.yml` has correct Eureka URL
4. Wait 30 seconds for registration
5. Check service logs for registration errors

### Config Not Loading

**Check**:
1. Config Server is running (8888)
2. `bootstrap.yml` exists and has `spring.cloud.config.uri`
3. Config file name matches `spring.application.name`
4. Check Config Server logs

### Gateway Not Routing

**Check**:
1. Service is registered in Eureka
2. Route configuration in `api-gateway.yml`
3. Gateway logs show route creation
4. Test direct service access (bypass gateway)

---

## Success Criteria ✅

Your stack is working correctly if:

- [ ] All 4 services start without errors
- [ ] All services show UP in Eureka dashboard
- [ ] Can register a user successfully
- [ ] Can login and receive JWT tokens
- [ ] Can refresh tokens
- [ ] Can logout
- [ ] Validation errors return proper format
- [ ] Requests work through both direct and gateway URLs
- [ ] H2 console shows data in tables
- [ ] Gateway logs show request/response timing
- [ ] Circuit breaker fallback works when service is down

---

## Next Steps After Successful Testing

1. ✅ Infrastructure working (Discovery, Config, Gateway)
2. ✅ Auth Service working (Register, Login, Tokens, Logout)
3. 🔜 Build User Service
4. 🔜 Build Notification Service
5. 🔜 Add JWT authentication to Gateway
6. 🔜 Test inter-service communication

---

**Happy Testing!** 🚀

If you encounter any issues, check the logs in each terminal for detailed error messages.
