# Quick Start Guide

## Automated Startup (Recommended)

### Option 1: Use Startup Script

```batch
START_SERVICES.bat
```

This will automatically start all services in the correct order with proper delays.

---

## Manual Startup

If you prefer manual control, open **4 separate terminal windows**:

### Terminal 1: Discovery Service

```batch
cd o:\Projects\Templates\javat-microservices\discovery-service
mvn spring-boot:run
```

**Wait for**: `Started DiscoveryServiceApplication` (about 20 seconds)

---

### Terminal 2: Config Server

```batch
cd o:\Projects\Templates\javat-microservices\config-server
mvn spring-boot:run
```

**Wait for**: `Started ConfigServerApplication` (about 15 seconds)

---

### Terminal 3: API Gateway

```batch
cd o:\Projects\Templates\javat-microservices\api-gateway
mvn spring-boot:run
```

**Wait for**: `Started ApiGatewayApplication` (about 15 seconds)

---

### Terminal 4: Auth Service

```batch
cd o:\Projects\Templates\javat-microservices\auth-service
mvn spring-boot:run
```

**Wait for**: `Started AuthServiceApplication` (about 15 seconds)

---

## Verification

### Quick Test

```batch
TEST_SERVICES.bat
```

This will:
- Check all services are healthy
- Open Eureka Dashboard
- Test user registration

### Manual Verification

1. **Eureka Dashboard**: http://localhost:8761
   - Should show CONFIG-SERVER, API-GATEWAY, AUTH-SERVICE

2. **Health Checks**:
   ```batch
   curl http://localhost:8761/actuator/health
   curl http://localhost:8888/actuator/health
   curl http://localhost:8080/actuator/health
   curl http://localhost:8082/actuator/health
   ```

3. **Register a User**:
   ```batch
   curl -X POST http://localhost:8082/api/auth/register ^
     -H "Content-Type: application/json" ^
     -d "{\"username\":\"testuser\",\"email\":\"test@example.com\",\"password\":\"Test123!@#\",\"confirmPassword\":\"Test123!@#\",\"firstName\":\"Test\",\"lastName\":\"User\"}"
   ```

---

## Troubleshooting

### Config Server Not Responding

**Symptoms**: API Gateway fails with "Could not locate PropertySource"

**Solution**:
1. Make sure Config Server is fully started
2. Wait for log message: `Started ConfigServerApplication`
3. Test Config Server manually:
   ```batch
   curl http://localhost:8888/api-gateway/dev
   ```
   Should return JSON configuration

### Service Not Registering with Eureka

**Solution**:
1. Wait 30-60 seconds after service starts
2. Check service logs for registration messages
3. Verify Discovery Service is running on port 8761

### Port Already in Use

**Solution**:
```batch
netstat -ano | findstr :8761
netstat -ano | findstr :8888
netstat -ano | findstr :8080
netstat -ano | findstr :8082
```

Kill the process using the PID shown.

---

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| Discovery Service | 8761 | http://localhost:8761 |
| Config Server | 8888 | http://localhost:8888 |
| API Gateway | 8080 | http://localhost:8080 |
| Auth Service | 8082 | http://localhost:8082 |

---

## Next Steps

After all services are running:

1. ✅ Read **TESTING_GUIDE.md** for comprehensive testing
2. ✅ Test authentication endpoints (register, login, refresh, logout)
3. ✅ Test API Gateway routing
4. ✅ Test error handling and validation
5. ✅ Check H2 database console: http://localhost:8082/h2-console

---

## Stopping Services

Press `Ctrl+C` in each terminal window, or close the windows.

**Stop in reverse order**:
1. Auth Service
2. API Gateway
3. Config Server
4. Discovery Service

---

**Need detailed testing?** See `TESTING_GUIDE.md`

**Having issues?** Check the logs in each terminal for detailed error messages.
