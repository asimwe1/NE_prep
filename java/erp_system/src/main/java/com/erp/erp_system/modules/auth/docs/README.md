# Authentication Module

Handles employee registration, login, password hashing, and JWT generation.

Requests enter through `AuthController`, delegate to `AuthService`, and use the shared
employee module for account persistence. JWT validation is handled in `common/security`.
