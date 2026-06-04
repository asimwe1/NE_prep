# RBAC (Role-Based Access Control) Guide

## Overview

The Auth Service implements comprehensive Role-Based Access Control (RBAC) using Spring Security's method-level security with `@PreAuthorize` annotations.

## Available Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| `USER` | Standard user (default) | Basic access |
| `ADMIN` | Administrator | Full system access |
| `MANAGER` | Manager | Management operations |
| `MODERATOR` | Content moderator | Moderation operations |

**Default Role**: New users are automatically assigned `USER` role upon registration.

## Role Management API

### Add Role to User

**Endpoint**: `POST /api/auth/roles/add`  
**Authorization**: Requires `ADMIN` role  

**Request**:
```json
{
  "username": "johndoe",
  "role": "MANAGER"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Role 'MANAGER' added to user successfully",
  "data": ["USER", "MANAGER"]
}
```

**Example**:
```bash
curl -X POST http://localhost:8082/api/auth/roles/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -d '{
    "username": "johndoe",
    "role": "MANAGER"
  }'
```

### Remove Role from User

**Endpoint**: `POST /api/auth/roles/remove`  
**Authorization**: Requires `ADMIN` role  

**Request**:
```json
{
  "username": "johndoe",
  "role": "MANAGER"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Role 'MANAGER' removed from user successfully",
  "data": ["USER"]
}
```

**Note**: Cannot remove the last role from a user.

### Get User Roles

**Endpoint**: `GET /api/auth/roles/{username}`  
**Authorization**: Requires `ADMIN` role  

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User roles retrieved successfully",
  "data": ["USER", "ADMIN"]
}
```

**Example**:
```bash
curl http://localhost:8082/api/auth/roles/johndoe \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### Check if User Has Role

**Endpoint**: `GET /api/auth/roles/{username}/has/{role}`  
**Authorization**: Requires `ADMIN` role  

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User has role 'ADMIN'",
  "data": true
}
```

**Example**:
```bash
curl http://localhost:8082/api/auth/roles/johndoe/has/ADMIN \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

## Using @PreAuthorize in Your Services

### Method-Level Security

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    // Only authenticated users can access
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getProfile() {
        // ...
    }

    // Only admins can access
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        // ...
    }

    // Only admins or managers can access
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @GetMapping("/reports")
    public ResponseEntity<List<Report>> getReports() {
        // ...
    }

    // Only owner or admin can access
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.userId")
    @PutMapping("/{userId}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long userId) {
        // ...
    }

    // Complex authorization logic
    @PreAuthorize("hasRole('ADMIN') or (hasRole('MANAGER') and @userService.isInSameDepartment(#userId, authentication.principal.userId))")
    @GetMapping("/{userId}/details")
    public ResponseEntity<UserDetails> getUserDetails(@PathVariable Long userId) {
        // ...
    }
}
```

### Service-Level Security

```java
@Service
public class AdminService {

    // All methods require ADMIN role
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAllUsers() {
        // ...
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void updateSystemSettings(Settings settings) {
        // ...
    }
}
```

### Class-Level Security

```java
// All methods in this controller require ADMIN role
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        // Requires ADMIN role
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        // Requires ADMIN role
    }

    // Override class-level security
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @GetMapping("/stats")
    public ResponseEntity<Statistics> getStatistics() {
        // Requires ADMIN or MANAGER role
    }
}
```

## @PreAuthorize Expressions

### Basic Expressions

| Expression | Description |
|------------|-------------|
| `isAuthenticated()` | User is logged in |
| `isAnonymous()` | User is not logged in |
| `hasRole('ADMIN')` | User has ADMIN role |
| `hasAnyRole('ADMIN', 'MANAGER')` | User has any of the specified roles |
| `hasAuthority('READ_PRIVILEGE')` | User has specific authority |
| `permitAll()` | Allow all users |
| `denyAll()` | Deny all users |

### Advanced Expressions

```java
// Check role AND custom condition
@PreAuthorize("hasRole('ADMIN') and #userId != null")
public void updateUser(Long userId) { }

// Check if user owns the resource
@PreAuthorize("#userId == authentication.principal.userId")
public void updateOwnProfile(Long userId) { }

// Call custom security service
@PreAuthorize("@securityService.canAccess(#resourceId, authentication)")
public void accessResource(Long resourceId) { }

// Complex business logic
@PreAuthorize("hasRole('MANAGER') and @projectService.isProjectManager(#projectId, authentication.principal.userId)")
public void updateProject(Long projectId) { }
```

## Creating an Admin User

### Method 1: Direct Database Update

After registering a user, add ADMIN role via database:

```sql
-- Add ADMIN role to user
INSERT INTO user_roles (user_id, role) 
VALUES ((SELECT id FROM users WHERE username = 'admin'), 'ADMIN');
```

### Method 2: Programmatic (Startup Bean)

Create an initialization bean:

```java
@Component
@RequiredArgsConstructor
public class AdminUserInitializer {

    private final UserRepository userRepository;

    @PostConstruct
    public void initAdminUser() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@example.com")
                    .password(PasswordUtil.encode("Admin123!"))
                    .enabled(true)
                    .build();
            
            admin.addRole(SecurityConstants.ROLE_USER);
            admin.addRole(SecurityConstants.ROLE_ADMIN);
            
            userRepository.save(admin);
            log.info("Admin user created");
        }
    }
}
```

### Method 3: API After First User

1. Register first user
2. Manually add ADMIN role in database
3. Use that admin to add roles to other users via API

## JWT Token with Roles

Access tokens include user roles in claims:

```json
{
  "sub": "johndoe",
  "userId": 1,
  "username": "johndoe",
  "roles": ["USER", "MANAGER"],
  "tokenType": "ACCESS",
  "iat": 1654531200,
  "exp": 1654532100
}
```

## Extracting User Info in Controllers

```java
@RestController
public class MyController {

    // Get authenticated user from JWT
    @GetMapping("/me")
    public ResponseEntity<UserInfo> getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        // ...
    }

    // Using @AuthenticationPrincipal
    @GetMapping("/profile")
    public ResponseEntity<UserDTO> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails.getUserId();
        String username = userDetails.getUsername();
        Set<String> roles = userDetails.getRoles();
        // ...
    }
}
```

## Role Hierarchy (Optional Future Enhancement)

Define role hierarchy where higher roles inherit permissions:

```yaml
# application.yml
spring:
  security:
    role-hierarchy: >
      ROLE_ADMIN > ROLE_MANAGER
      ROLE_MANAGER > ROLE_MODERATOR
      ROLE_MODERATOR > ROLE_USER
```

With hierarchy:
- `ADMIN` can access endpoints requiring `MANAGER`, `MODERATOR`, or `USER`
- `MANAGER` can access endpoints requiring `MODERATOR` or `USER`
- `MODERATOR` can access endpoints requiring `USER`

## Testing RBAC

### Unit Test Example

```java
@SpringBootTest
@AutoConfigureMockMvc
class RoleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanAddRoles() throws Exception {
        mockMvc.perform(post("/api/auth/roles/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"john\",\"role\":\"MANAGER\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void userCannotAddRoles() throws Exception {
        mockMvc.perform(post("/api/auth/roles/add")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"john\",\"role\":\"MANAGER\"}"))
                .andExpect(status().isForbidden());
    }
}
```

## Best Practices

1. **Principle of Least Privilege**: Assign minimum required roles
2. **Use Method Security**: Prefer `@PreAuthorize` over URL-based security
3. **Consistent Naming**: Use consistent role naming conventions
4. **Audit Role Changes**: Log all role modifications
5. **Role Validation**: Always validate roles before assignment
6. **Prevent Last Role Removal**: Users must have at least one role
7. **Secure Admin Creation**: Protect admin user creation
8. **Document Permissions**: Clear documentation for each role

## Common Patterns

### Admin-Only Endpoint
```java
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/delete-all")
public void deleteAll() { }
```

### Owner or Admin
```java
@PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.userId")
@PutMapping("/{userId}")
public void update(@PathVariable Long userId) { }
```

### Multi-Role Access
```java
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'MODERATOR')")
@GetMapping("/dashboard")
public Dashboard getDashboard() { }
```

### Custom Security Check
```java
@PreAuthorize("@customSecurityService.canAccessResource(#id, authentication)")
@GetMapping("/resource/{id}")
public Resource getResource(@PathVariable Long id) { }
```

## Error Responses

### 403 Forbidden (Insufficient Permissions)
```json
{
  "success": false,
  "message": "You don't have permission to access this resource",
  "errorCode": "ACCESS_DENIED",
  "statusCode": 403
}
```

### 401 Unauthorized (Not Authenticated)
```json
{
  "success": false,
  "message": "Authentication failed",
  "errorCode": "UNAUTHORIZED",
  "statusCode": 401
}
```

---

**RBAC is now fully implemented and production-ready!** ✅

All microservices can leverage `@PreAuthorize` for fine-grained access control.
