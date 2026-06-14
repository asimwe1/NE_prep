# FEMCS — Full Codebase Reference

**Fire Extinguisher Management and Compliance System**

This document covers every layer of the system: architecture, database, all backend services, API gateway, frontend, CI/CD, environment variables, and how to run and maintain the platform. Read it start to finish once; afterwards use the section headers to look up anything specific.

---

## Table of Contents

1. [What This System Does](#1-what-this-system-does)
2. [Repository Layout](#2-repository-layout)
3. [Architecture Overview](#3-architecture-overview)
4. [Running the System](#4-running-the-system)
5. [Environment Variables](#5-environment-variables)
6. [Database — Schema & Migrations](#6-database--schema--migrations)
7. [API Gateway](#7-api-gateway)
8. [Backend Services](#8-backend-services)
   - [Auth Service (port 5001)](#81-auth-service-port-5001)
   - [Customer Service (port 5002)](#82-customer-service-port-5002)
   - [Extinguisher Service (port 5003)](#83-extinguisher-service-port-5003)
   - [Notification Service (port 5004)](#84-notification-service-port-5004)
   - [Report Service (port 5005)](#85-report-service-port-5005)
9. [Shared Backend Utilities](#9-shared-backend-utilities)
10. [Frontend](#10-frontend)
    - [Pages](#101-pages)
    - [Components](#102-components)
    - [Auth Context](#103-auth-context)
    - [API Service Layer](#104-api-service-layer)
    - [Routing & Guards](#105-routing--guards)
    - [Styling (index.css)](#106-styling-indexcss)
11. [CI/CD — GitHub Actions](#11-cicd--github-actions)
12. [Docker Compose — Full Stack](#12-docker-compose--full-stack)
13. [User Roles & Permissions](#13-user-roles--permissions)
14. [Key Flows (End to End)](#14-key-flows-end-to-end)
15. [Common Maintenance Tasks](#15-common-maintenance-tasks)
16. [Default Credentials](#16-default-credentials)

---

## 1. What This System Does

FEMCS lets a fire-safety company manage its entire extinguisher portfolio across multiple customer facilities.

| Capability | Detail |
|---|---|
| **Extinguisher registry** | Register units by serial number, type, size, facility, and location. Auto-generates `EXT-######` codes. |
| **Customer/facility management** | Track clients with their contact info and organization name. |
| **Inspection scheduling** | Assign verified inspectors to units, record outcomes and findings. |
| **Maintenance logging** | Record service events, technician, cost, issues found, next service date. |
| **Compliance tracking** | Automatic `compliance_status` (compliant / warning / critical / non_compliant) derived from expiry proximity. |
| **Automated alerts** | Daily cron at 08:00 emails customers at 90/60/30/7 days before expiry; marks units `expired`. |
| **Escalation ladder** | If a unit stays expired/non-compliant, nightly cron escalates in 5 stages and emails progressively. |
| **In-app notifications** | Bell icon in the header, 30-second polling, mark-read, mark-all-read. |
| **Reports** | Expired list, expiring-soon, compliance, inspection analytics, maintenance analytics — export JSON / CSV / PDF. |
| **Audit trail** | Every write action is logged to `audit_logs` with the user, IP, old/new values. |
| **User management** | Admins can activate/deactivate users and change roles. |
| **Password reset** | 6-digit OTP sent via SMTP, valid 10 minutes. |

---

## 2. Repository Layout

```
FEMS/
├── .github/
│   └── workflows/
│       └── docker-build.yml        # CI — build + push Docker images to GHCR
├── api-gateway/
│   ├── src/
│   │   └── index.js                # Express reverse-proxy + Swagger UI (port 5000)
│   ├── Dockerfile
│   └── package.json
├── services/
│   ├── auth-service/               # Register, login, JWT, users, OTP reset (port 5001)
│   ├── entry-service/              # Customer/facility CRUD — compose name: customer-service (port 5002)
│   ├── extinguisher-service/       # Extinguishers, inspections, maintenance (port 5003)
│   ├── notification-service/       # Notifications, escalations, cron scheduler (port 5004)
│   ├── report-service/             # Reports, audit log, dashboard summary (port 5005)
│   └── shared/
│       └── http.js                 # Common Express middleware used by all services
├── frontend/
│   ├── src/
│   │   ├── App.js                  # Router, route guards
│   │   ├── index.js                # React entry point
│   │   ├── index.css               # Full design system (dark theme)
│   │   ├── context/
│   │   │   └── AuthContext.js      # JWT auth state for the whole app
│   │   ├── services/
│   │   │   └── api.js              # Axios instance + all API functions
│   │   ├── components/
│   │   │   ├── Layout.js           # App shell (sidebar, topbar, notifications)
│   │   │   ├── Modal.js            # Reusable portal dialog
│   │   │   └── Pagination.js       # Reusable page controls
│   │   └── pages/
│   │       ├── LoginPage.js
│   │       ├── RegisterPage.js
│   │       ├── ForgotPasswordPage.js
│   │       ├── ResetPasswordPage.js
│   │       ├── DashboardPage.js
│   │       ├── CustomersPage.js
│   │       ├── ExtinguishersPage.js
│   │       ├── InspectionsPage.js
│   │       ├── MaintenancePage.js
│   │       ├── ReportsPage.js
│   │       ├── AuditLogsPage.js
│   │       ├── EscalationsPage.js
│   │       └── UsersPage.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml              # Full 8-container stack
├── schema.sql                      # Primary DDL (run on first DB init)
├── migrate.sql                     # Idempotent upgrades for existing databases
├── seed.sql                        # Demo data (run manually)
├── swagger.yaml                    # OpenAPI 3.0.3 specification
├── .env.example                    # Root env template
└── README.md
```

---

## 3. Architecture Overview

```
Browser (React :3000)
       │
       ▼
API Gateway (:5000)   ← Swagger UI, rate-limit 300/15min, CORS
       │
       ├──/api/auth          ──► Auth Service        (:5001)
       ├──/api/customers     ──► Customer Service    (:5002)
       ├──/api/extinguishers ──► Extinguisher Svc    (:5003)
       ├──/api/inspections   ──► Extinguisher Svc    (:5003)
       ├──/api/maintenance   ──► Extinguisher Svc    (:5003)
       ├──/api/notifications ──► Notification Svc    (:5004)
       └──/api/reports       ──► Report Service      (:5005)
                                                          │
                                             All services │
                                                          ▼
                                                PostgreSQL (:5432)
                                                  femcs_db
```

**Key design decisions:**

- **Single shared database.** All five services read/write the same PostgreSQL database (`femcs_db`). There is no per-service DB isolation. This keeps joins simple at the cost of tight coupling.
- **Shared JWT secret.** The `JWT_SECRET` environment variable is the same across all services. Each service validates the Bearer token independently — there is no central auth middleware at the gateway.
- **Stateless services.** Every container is stateless; the only persistent state is in Postgres and in `localStorage` on the browser.

---

## 4. Running the System

### Prerequisites

- Docker Desktop installed and running
- `git clone` the repository

### Step 1 — Create the root `.env`

```env
JWT_SECRET=femcs_jwt_super_secret_change_in_production

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Fire Extinguisher System <your@gmail.com>
```

Save this file as `FEMS/.env` (next to `docker-compose.yml`).

### Step 2 — Start everything

```bash
cd FEMS
docker compose up --build
```

Background mode:
```bash
docker compose up --build -d
```

On first start Docker mounts `schema.sql` and `migrate.sql` into Postgres and runs them automatically. The database is initialised once and reused on subsequent starts via the `pgdata` Docker volume.

### Step 3 — Verify

| URL | What |
|---|---|
| `http://localhost:3000` | React frontend |
| `http://localhost:5000` | API Gateway info |
| `http://localhost:5000/api/docs` | Swagger UI |
| `http://localhost:5000/health` | Gateway health check |

### Step 4 — Load demo data (optional)

```bash
docker exec -i fems-postgres-1 psql -U femcs femcs_db < seed.sql
```

(Container name may vary — run `docker ps` to confirm.)

### Stopping

```bash
docker compose down          # keeps the pgdata volume
docker compose down -v       # also destroys the database volume
```

### Development (no Docker)

Start Postgres separately, then in each service directory:

```bash
npm install
# Create .env copying from .env.example and filling values
npm start    # or node src/index.js
```

Frontend:
```bash
cd frontend && npm install && npm start
```

The CRA dev server proxies `/api` to `http://localhost:5000` (configured in `frontend/package.json`).

---

## 5. Environment Variables

### Root `.env` (read by Docker Compose for all services)

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Shared secret for signing/verifying JWTs. Change in production. |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_SECURE` | `true` for port 465, `false` for 587 with STARTTLS |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password or app password |
| `EMAIL_FROM` | Display name and address for outgoing emails |

### Per-service `.env.example` (same variables, different ports)

Each service folder has an `.env.example`. Key variables:

| Variable | Default (Docker) | Purpose |
|---|---|---|
| `PORT` | 5001–5005 | Service listening port |
| `DB_URL` | `postgres://femcs:femcs_secret@postgres:5432/femcs_db` | Database connection string |
| `JWT_SECRET` | (from root .env) | Must match across all services |
| `SMTP_*` / `EMAIL_FROM` | (from root .env) | Email sending |

### Gateway `.env`

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 5000 | Gateway port |
| `AUTH_SERVICE_URL` | `http://auth-service:5001` | Upstream |
| `CUSTOMER_SERVICE_URL` | `http://customer-service:5002` | Upstream |
| `EXTINGUISHER_SERVICE_URL` | `http://extinguisher-service:5003` | Upstream |
| `NOTIFICATION_SERVICE_URL` | `http://notification-service:5004` | Upstream |
| `REPORT_SERVICE_URL` | `http://report-service:5005` | Upstream |
| `FRONTEND_URL` | `http://localhost:3000` | CORS allow-origin |

### Frontend

| Variable | Default | Purpose |
|---|---|---|
| `REACT_APP_API_URL` | `http://localhost:5000/api` | Base URL for all API calls |

---

## 6. Database — Schema & Migrations

### How the DB is initialised

`docker-compose.yml` mounts:
- `schema.sql` → `/docker-entrypoint-initdb.d/01-schema.sql`
- `migrate.sql` → `/docker-entrypoint-initdb.d/02-migrate.sql`

Postgres runs these **once** when the data directory is empty. On restart with existing `pgdata`, they are not re-executed.

### Tables

#### `users`
Stores all platform users.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `first_name` | VARCHAR(100) | |
| `last_name` | VARCHAR(100) | |
| `email` | VARCHAR(255) UNIQUE | Login identifier |
| `password` | VARCHAR(255) | bcrypt hash |
| `role` | VARCHAR(20) | `admin` / `inspector` / `user` |
| `is_active` | BOOLEAN | Default `true`; deactivated users cannot log in |
| `created_at`, `updated_at` | TIMESTAMPTZ | Auto-managed by trigger |

---

#### `customers`
Represents a facility or client organisation.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `customer_code` | VARCHAR(20) UNIQUE | Auto-generated `CUST-######` |
| `full_name` | VARCHAR(200) | Individual or org contact name |
| `national_id` | VARCHAR(50) UNIQUE | Optional — Rwanda NID |
| `phone` | VARCHAR(30) | Required |
| `email` | VARCHAR(255) | Optional |
| `address` | TEXT | |
| `organization_name` | VARCHAR(200) | |
| `is_active` | BOOLEAN | |
| `created_by` | UUID → users | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

#### `extinguishers`
The core record — one row per physical unit.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `extinguisher_code` | VARCHAR(30) UNIQUE | Auto `EXT-######` |
| `serial_number` | VARCHAR(100) UNIQUE | Physical serial plate |
| `type` | VARCHAR(30) | `Water` / `CO2` / `Foam` / `Dry Chemical` |
| `size` | VARCHAR(20) | `2.5 lb` / `5 lb` / `9 lb` / `12 lb` |
| `capacity_liters` | DECIMAL(8,2) | Optional |
| `manufacture_date` | DATE | |
| `purchase_date` | DATE | |
| `installation_date` | DATE | |
| `expiry_date` | DATE | Drives all compliance calculations |
| `last_inspection_date` | DATE | Updated when inspection completed |
| `next_inspection_date` | DATE | Set by inspector on completion |
| `location` | VARCHAR(300) | Physical location within facility |
| `customer_id` | UUID → customers | ON DELETE CASCADE |
| `status` | VARCHAR(30) | `active` / `expired` / `serviced` / `decommissioned` / `pending_inspection` |
| `compliance_status` | VARCHAR(30) | `compliant` / `warning` / `critical` / `non_compliant` |
| `notes` | TEXT | |
| `created_by` | UUID → users | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

#### `inspections`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `extinguisher_id` | UUID → extinguishers | ON DELETE CASCADE |
| `inspector_id` | UUID → users | The assigned inspector |
| `inspector_name` | VARCHAR(200) | Denormalized for display |
| `inspection_date` | DATE | |
| `inspection_time` | TIME | |
| `findings` | TEXT | Inspector notes |
| `status` | VARCHAR(30) | `Scheduled` / `Completed` / `Requires Service` / `Failed` |
| `next_inspection_date` | DATE | |
| `created_by` | UUID → users | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

#### `maintenance`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `extinguisher_id` | UUID → extinguishers | ON DELETE CASCADE |
| `service_date` | DATE | |
| `service_company` | VARCHAR(200) | |
| `technician_name` | VARCHAR(200) | |
| `action_taken` | VARCHAR(255) | Short summary of work |
| `issues_identified` | TEXT | Full description of problems |
| `recommendations` | TEXT | Follow-up suggestions |
| `next_service_date` | DATE | |
| `cost` | DECIMAL(12,2) | Default 0.00 |
| `description` | TEXT | General notes |
| `status` | VARCHAR(30) | `scheduled` / `in_progress` / `completed` / `cancelled` |
| `created_by` | UUID → users | |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

#### `notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `customer_id` | UUID → customers | |
| `extinguisher_id` | UUID → extinguishers | |
| `user_id` | UUID → users | Target user (for in-app) |
| `type` | VARCHAR(50) | `expiry_alert` / `inspection_due` / `service_due` / `compliance_violation` / `escalation` / `general` |
| `title` | VARCHAR(300) | |
| `message` | TEXT | |
| `is_read` | BOOLEAN | Default `false` |
| `email_sent` | BOOLEAN | Whether email was sent |
| `email_sent_at` | TIMESTAMPTZ | |
| `days_until_expiry` | INTEGER | For threshold alerts |
| `escalation_stage` | INTEGER | 0 = not escalated |
| `recipient_email` | VARCHAR(255) | |
| `created_at` | TIMESTAMPTZ | |

---

#### `escalations`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `extinguisher_id` | UUID → extinguishers | |
| `customer_id` | UUID → customers | |
| `stage` | INTEGER 1–5 | Stage label: Reminder / Urgent Warning / Safety Officer / Regulatory / Compliance Case |
| `reason` | TEXT | |
| `status` | VARCHAR(30) | `open` / `acknowledged` / `resolved` / `closed` |
| `resolved_at` | TIMESTAMPTZ | |
| `resolved_by` | UUID → users | |
| `notes` | TEXT | Resolution notes |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

---

#### `otps`
One-time passwords for password reset.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → users | |
| `email` | VARCHAR(255) | |
| `code` | VARCHAR(6) | 6-digit numeric code |
| `purpose` | VARCHAR(30) | `password_reset` / `email_verify` |
| `is_used` | BOOLEAN | Consumed after first use |
| `expires_at` | TIMESTAMPTZ | 10 minutes after creation |
| `created_at` | TIMESTAMPTZ | |

---

#### `audit_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID → users | Who performed the action |
| `user_email` | VARCHAR(255) | Denormalized for display |
| `action` | VARCHAR(100) | e.g. `CREATE_EXTINGUISHER`, `LOGIN` |
| `entity_type` | VARCHAR(50) | e.g. `extinguisher`, `user` |
| `entity_id` | UUID | ID of the affected record |
| `old_values` | JSONB | State before the change |
| `new_values` | JSONB | State after the change |
| `ip_address` | VARCHAR(50) | |
| `user_agent` | TEXT | |
| `created_at` | TIMESTAMPTZ | |

---

### Indexes

Indexes are created on all high-frequency lookup columns:

- `users.email`
- `customers.customer_code`, `customers.email`
- `extinguishers.extinguisher_code`, `.serial_number`, `.customer_id`, `.expiry_date`, `.status`
- `inspections.extinguisher_id`, `.inspection_date`
- `maintenance.extinguisher_id`
- `notifications.user_id`, `.customer_id`, `.is_read`
- `otps.email`, `.expires_at`
- `audit_logs.user_id`, `(entity_type, entity_id)`, `.created_at`

### `updated_at` trigger

A single PostgreSQL function `update_updated_at_column()` is attached as a BEFORE UPDATE trigger to `users`, `customers`, `extinguishers`, `inspections`, `maintenance`, and `escalations`. It sets `updated_at = NOW()` automatically on every row update.

### `migrate.sql`

Contains idempotent `ALTER TABLE` statements that add or change columns that were added after the original schema. Safe to run on both new and existing databases:

- Creates `otps` table if missing
- Corrects `users.role` CHECK constraint and default
- Adds `extinguishers.type` CHECK, `size` default, `installation_date` default
- Drops NOT NULL from `capacity_liters`
- Adds `inspections.inspection_time`, corrects `inspections.status` CHECK
- Adds `maintenance.action_taken`, `issues_identified`, `recommendations`

---

## 7. API Gateway

**File:** `api-gateway/src/index.js`  
**Port:** 5000

The gateway is a thin Express application. It does **not** validate JWTs — it simply forwards requests to the appropriate service with the original `Authorization` header intact. Each service validates tokens independently.

### Middleware stack (in order)

1. `helmet` (relaxed CSP on `/api/docs` routes to allow Swagger UI assets)
2. CORS — allows `FRONTEND_URL`
3. Rate limiter — 300 requests per 15 minutes per IP
4. `morgan` — HTTP request logging

### Proxy routing table

| Gateway path | Upstream service | Path rewrite |
|---|---|---|
| `/api/auth/*` | `AUTH_SERVICE_URL` | `/api/auth/` → `/` |
| `/api/customers/*` | `CUSTOMER_SERVICE_URL` | `/api/customers/` → `/` |
| `/api/extinguishers/*` | `EXTINGUISHER_SERVICE_URL` | `/api/` → `/` |
| `/api/inspections/*` | `EXTINGUISHER_SERVICE_URL` | `/api/` → `/` |
| `/api/maintenance/*` | `EXTINGUISHER_SERVICE_URL` | `/api/` → `/` |
| `/api/notifications/*` | `NOTIFICATION_SERVICE_URL` | `/api/notifications/` → `/` |
| `/api/reports/*` | `REPORT_SERVICE_URL` | `/api/reports/` → `/` |

### Gateway-only endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | API info, version, doc links |
| GET | `/health` | Gateway status + upstream URLs |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/docs/swagger.yaml` | Raw OpenAPI YAML |
| GET | `/api/docs/swagger.json` | Raw OpenAPI JSON |

---

## 8. Backend Services

All services follow the same pattern:
1. `require` shared middleware from `services/shared/http.js`
2. Mount route file(s)
3. Add `/health` endpoint
4. Add notFound + errorHandler from shared module
5. Listen on `PORT`

Authentication is enforced by middleware functions `authenticate` (checks Bearer JWT) and `authorize(...roles)` (checks role) defined in each service's `src/middleware/auth.js`.

---

### 8.1 Auth Service (port 5001)

**Source:** `services/auth-service/src/`  
**Purpose:** Everything about users — registration, login, token issuance, profile, password reset, user management (admin), OTP email.

**Validation library:** Joi  
**Password rules:** 8–64 chars, must contain uppercase, lowercase, digit, and one of `@$!%*.?&_-#`

#### All Endpoints

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/register` | None | Create account. Body: `firstName`, `lastName`, `email`, `password`, `role` (optional, defaults `user`). Returns `{token, user}`. |
| POST | `/login` | None | Body: `email`, `password`. Returns `{token, user}`. Writes audit log. |
| POST | `/logout` | JWT | Writes audit log. |
| GET | `/validate` | JWT | Returns the decoded user payload — used by frontend on startup. |
| GET | `/me` | JWT | Full profile of the current user. |
| PATCH | `/profile` | JWT | Update `firstName`, `lastName`, `email`. Issues a fresh token. |
| POST | `/forgot-password` | None | Body: `{email}`. Generates a 6-digit OTP valid 10 minutes, sends it via SMTP. |
| POST | `/reset-password` | None | Body: `{email, code, newPassword}`. Validates OTP, sets new password. |
| POST | `/change-password` | JWT | Body: `{currentPassword, newPassword}`. Validates current before changing. |
| GET | `/inspectors` | JWT | Returns all active users with role `inspector`. |
| GET | `/users` | Admin only | Paginated user list. Query: `page`, `limit`, `search` (name/email). |
| PATCH | `/users/:id/toggle` | Admin only | Flip `is_active`. Cannot deactivate yourself. |
| PATCH | `/users/:id/role` | Admin only | Body: `{role}`. Cannot change your own role. |

**Mailer (`mailer.js`):** Nodemailer with the SMTP config from env. Used for OTP emails.

---

### 8.2 Customer Service (port 5002)

**Source:** `services/entry-service/src/`  
**Compose service name:** `customer-service`  
**Purpose:** CRUD for customer/facility records.

**Auto-generated codes:** `CUST-` + zero-padded 6-digit number based on count.  
**Validation:** Rwanda phone format, basic email format, required fields.

#### All Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create customer. Body: `fullName`, `phone`, `email`, `nationalId`, `address`, `organizationName`. |
| GET | `/` | JWT | List customers. Query: `page` (default 1), `limit` (default 10), `search` (matches name, code, phone, org). Returns `{data, pagination}`. |
| GET | `/:id` | JWT | Get one customer by UUID. Includes `extinguisher_count`. |
| PUT | `/:id` | JWT | Update customer fields. |
| DELETE | `/:id` | Admin | Delete. Fails with 409 if customer has extinguishers. |

---

### 8.3 Extinguisher Service (port 5003)

**Source:** `services/extinguisher-service/src/`  
**Purpose:** Three route groups — extinguishers, inspections, maintenance — all mounted in one service.

**Auto-generated codes:** `EXT-` + zero-padded 6-digit number.  
**Email on registration:** Optional — if customer has email, sends a registration confirmation.

#### Extinguisher Endpoints (`/extinguishers`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Register unit. Required: `serialNumber`, `type`, `size`, `installationDate`, `expiryDate`, `location`, `customerId`. Optional: `manufactureDate`, `purchaseDate`, `lastInspectionDate`, `nextInspectionDate`, `status`, `notes`. |
| GET | `/` | JWT | List. Query: `page`, `limit`, `search`, `status`, `type`, `customerId`, `compliance`. Returns `{data, pagination}`. |
| GET | `/stats` | JWT | Aggregate counts by status, type, compliance; also top customers by count. |
| GET | `/:id` | JWT | Get one. Joins `customers` for facility info. |
| PUT | `/:id` | JWT | Update. Validates date order (install ≤ expiry). |
| DELETE | `/:id` | Admin | Delete. |

#### Inspection Endpoints (`/inspections`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create. Required: `extinguisherId`, `inspectorId`, `inspectionDate`, `inspectionTime`, `status`. Optional: `findings`, `nextInspectionDate`. Denormalizes inspector name. On `Completed` — updates `last_inspection_date` on the extinguisher. |
| GET | `/` | JWT | List. Query: `page`, `limit`, `extinguisherId`, `status`. Joins extinguisher code + inspector name. |
| GET | `/:id` | JWT | Get one. |
| PUT | `/:id` | JWT | Update. |

#### Maintenance Endpoints (`/maintenance`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create record. Required: `extinguisherId`, `serviceDate`, `serviceCompany`, `technicianName`, `actionTaken`, `issuesIdentified`. Optional: `recommendations`, `nextServiceDate`, `cost`, `description`, `status`. |
| GET | `/` | JWT | List. Query: `page`, `limit`, `extinguisherId`, `status`. |
| GET | `/:id` | JWT | Get one. |
| PUT | `/:id` | JWT | Full update. |
| PATCH | `/:id/status` | JWT | Body: `{status}`. Quick status change without full update. |

**Mailer (`mailer.js`):** Used to send extinguisher registration emails.

---

### 8.4 Notification Service (port 5004)

**Source:** `services/notification-service/src/`  
**Purpose:** In-app notification store, email alerts, automated escalation ladder.

#### API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | User's notifications. Query: `page`, `limit`, `unread` (true/false), `type`. Response includes `unreadCount`. |
| PATCH | `/:id/read` | JWT | Mark one notification as read (must belong to calling user). |
| PATCH | `/read-all` | JWT | Mark all of calling user's notifications as read. |
| GET | `/escalations` | Admin / Inspector | All escalations. Query: `page`, `limit`, `status`. |
| PATCH | `/escalations/:id/resolve` | Admin / Inspector | Resolve. Body: `{notes}`. Sets `status=resolved`, `resolved_at`, `resolved_by`. |
| POST | `/trigger-check` | Admin | Manually trigger expiry + escalation checks (runs async, returns immediately). |

#### Scheduler (`scheduler.js`)

Runs two `node-cron` jobs when the service starts:

**08:00 daily — `checkExpiryAndNotify`**

1. Queries all non-decommissioned extinguishers with their customer info.
2. For each unit, calculates days until expiry.
3. If `days_until_expiry` ≤ 0: sets `status = 'expired'`, `compliance_status = 'non_compliant'`.
4. If `days_until_expiry` ≤ 7: sets `compliance_status = 'critical'`.
5. If ≤ 30: `warning`. If ≤ 90 and > 30: `warning`.
6. For thresholds 90, 60, 30, 7: creates a notification row and sends email if not already sent for this threshold+extinguisher.

**09:00 daily — `checkEscalations`**

1. Queries expired/non-compliant extinguishers.
2. Finds the current highest open escalation stage for each.
3. If no open escalation exists: creates stage 1.
4. If existing is resolved/closed and unit still non-compliant: creates next stage.
5. Stages 1–5 with escalating message severity and email content.

In development mode, both checks also run 3 seconds after startup.

**Mailer (`mailer.js`):** Sends expiry/escalation emails to customer email.

---

### 8.5 Report Service (port 5005)

**Source:** `services/report-service/src/`  
**Purpose:** All read-heavy analytics, the audit log API, dashboard summary.

**Export formats:** JSON (default), CSV (via `json2csv`), PDF (custom in-service plain-text generator).  
Add `?format=csv` or `?format=pdf` to any report endpoint.

#### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/summary` | JWT | Dashboard numbers: total extinguishers, active/expired/compliant counts, total customers, 30-day inspection and maintenance counts. |
| GET | `/expired` | JWT | All expired extinguishers with customer info. |
| GET | `/expiring-soon` | JWT | Query: `days` (default 90). Units expiring within N days. |
| GET | `/customers` | JWT | Facility coverage: each customer, extinguisher count, compliance breakdown. |
| GET | `/inspections` | JWT | Query: `from`, `to` (dates). Inspection records in range. |
| GET | `/inspections/status-summary` | JWT | Count by status. |
| GET | `/maintenance` | JWT | Query: `from`, `to`. Maintenance records in range. |
| GET | `/maintenance/frequency` | JWT | Per-extinguisher maintenance count. |
| GET | `/compliance` | JWT | All extinguishers with compliance status + highest open escalation stage. |
| GET | `/inventory/summary` | JWT | Daily, monthly, yearly registration counts. |
| GET | `/audit` | Admin only | Query: `page`, `limit`, `action`, `entityType`. Full audit log. |

---

## 9. Shared Backend Utilities

**File:** `services/shared/http.js`

All five services call `applyCommonMiddleware(app, serviceName)` at startup, which applies:

- `helmet()` — sets secure HTTP headers
- `cors({ origin: process.env.FRONTEND_URL || '*' })` — cross-origin requests
- `morgan('combined')` — request logging
- `express.json({ limit: '1mb' })` — JSON body parsing
- Request ID header (`X-Request-Id`) using `crypto.randomUUID()`
- Generic 404 handler (`notFoundHandler`)
- Generic error handler (`errorHandler`) — formats errors as `{error: message, errors: [...]}`, hides stack traces in production

---

## 10. Frontend

**Stack:** React 18, React Router v6, Axios, `react-hot-toast`, `date-fns`, `lucide-react`  
**Port (dev):** 3000  
**Build tool:** Create React App

---

### 10.1 Pages

#### `LoginPage.js`
Email + password form. On success calls `authAPI.login()`, then `AuthContext.login(user, token)`, then navigates to `/dashboard`.

#### `RegisterPage.js`
Registration form with password strength indicator. On success logs in automatically.

#### `ForgotPasswordPage.js`
Single email field. Calls `authAPI.forgotPassword(email)`. Shows success message to check email.

#### `ResetPasswordPage.js`
Three fields: email, 6-digit OTP, new password + confirm. Calls `authAPI.resetPassword()`. Navigates to login on success.

#### `DashboardPage.js`
Calls `reportAPI.summary()` for KPI cards:
- Total extinguishers, active, expired, compliant
- Total customers
- Inspections last 30 days
- Maintenance last 30 days

Also calls `reportAPI.expiringSoon({ days: 30 })` to show a list of units expiring this month.

#### `CustomersPage.js`
Table of all customers with search. Add / Edit (form modal) / View (detail modal) / Delete (admin only, with confirm dialog).

#### `ExtinguishersPage.js`
Table with filters for status, type, and compliance. Add / Edit (large form modal) / View (detail sections modal) / Delete (admin only). Edit pre-fills all current field values.

#### `InspectionsPage.js`
Table filtered by status. Schedule (Add) / Edit / View. Schedule form picks extinguisher + inspector from dropdowns. Admins and inspectors see extra outcome fields (next inspection date, findings).

#### `MaintenancePage.js`
Table filtered by status. Add / Edit / View. Has a quick "Complete" button for scheduled records. Form includes service company, technician, action, issues, recommendations, cost.

#### `ReportsPage.js`
Admin-only. Report type selector (expired, expiring-soon, customers, inspections, maintenance, compliance, inventory). Date range pickers where relevant. Preview table + Download CSV/PDF buttons.

#### `AuditLogsPage.js`
Admin-only. Scrollable table of all audit events. Filter by action, entity type. Click a row for full detail modal showing old/new JSON values.

#### `EscalationsPage.js`
Admin-only. Table of open/all escalations with stage badges. "Resolve" button opens a modal for resolution notes.

#### `UsersPage.js`
Admin-only. Table of all users. View profile / Change Role / Toggle active buttons per row.

---

### 10.2 Components

#### `Layout.js`
The application shell rendered for all authenticated routes. Contains:
- **Sidebar** with brand logo, nav links, admin nav section, user chip with change-password button and logout
- **Top bar** with page title, role pill, notification bell
- **Notification panel** — opens on bell click, lists last 15 notifications, mark-read on click, mark-all-read button. Polls every 30 seconds.
- **Change Password modal** — inline form using `authAPI.changePassword`
- Closes sidebar on route change (mobile)

#### `Modal.js`
A React portal that renders on `document.body` — ensures the dialog is never clipped by a parent's `overflow` or `z-index`. Props:
- `open` (boolean) — controls visibility
- `onClose` (function) — called when overlay is clicked
- `size` (`'md'` default / `'lg'`) — max-width 620px vs 860px
- `children` — any content

The modal panel itself is a simple scrollable box (`overflow-y: auto`, `max-height: 88vh`) with a sticky header and sticky footer.

#### `Pagination.js`
Renders previous/next buttons and page number buttons. Props: `pagination` object `{page, totalPages, limit}`, `onPageChange` callback.

---

### 10.3 Auth Context

**File:** `frontend/src/context/AuthContext.js`

Provides auth state to the entire app via React Context.

**State:**
- `user` — object `{id, firstName, lastName, email, role}` or `null`
- `loading` — `true` while restoring session on startup

**On mount:**
1. Reads `femcs_token` and `femcs_user` from `localStorage`
2. Sets `user` from stored JSON immediately (to avoid flash of login page)
3. Calls `authAPI.validate()` to confirm the token is still valid server-side
4. If validation fails, clears storage and sets `user = null`

**Exposed values:**
- `user`, `loading`
- `login(userData, token)` — saves to localStorage and state
- `logout()` — calls `authAPI.logout()`, clears storage and state
- `isAdmin` — `user?.role === 'admin'`
- `isInspector` — `user?.role === 'inspector'`
- `useAuth()` hook — throws if called outside `AuthProvider`

---

### 10.4 API Service Layer

**File:** `frontend/src/services/api.js`

A single Axios instance with:
- `baseURL` = `REACT_APP_API_URL` or `http://localhost:5000/api`
- 15-second timeout
- **Request interceptor:** attaches `Authorization: Bearer <token>` from `localStorage`
- **Response interceptor:** on 401 → clears storage → redirects to `/login`

#### Function groups

**`authAPI`**

| Function | HTTP | Path |
|---|---|---|
| `register(data)` | POST | `/auth/register` |
| `login(data)` | POST | `/auth/login` |
| `logout()` | POST | `/auth/logout` |
| `validate()` | GET | `/auth/validate` |
| `me()` | GET | `/auth/me` |
| `updateProfile(data)` | PATCH | `/auth/profile` |
| `getInspectors()` | GET | `/auth/inspectors` |
| `getUsers(params)` | GET | `/auth/users` |
| `toggleUser(id)` | PATCH | `/auth/users/:id/toggle` |
| `updateRole(id, role)` | PATCH | `/auth/users/:id/role` |
| `forgotPassword(email)` | POST | `/auth/forgot-password` |
| `resetPassword(data)` | POST | `/auth/reset-password` |
| `changePassword(data)` | POST | `/auth/change-password` |

**`customerAPI`**

| Function | HTTP | Path |
|---|---|---|
| `create(data)` | POST | `/customers` |
| `list(params)` | GET | `/customers` |
| `get(id)` | GET | `/customers/:id` |
| `update(id, data)` | PUT | `/customers/:id` |
| `delete(id)` | DELETE | `/customers/:id` |

**`extinguisherAPI`**

| Function | HTTP | Path |
|---|---|---|
| `create(data)` | POST | `/extinguishers` |
| `list(params)` | GET | `/extinguishers` |
| `get(id)` | GET | `/extinguishers/:id` |
| `update(id, data)` | PUT | `/extinguishers/:id` |
| `delete(id)` | DELETE | `/extinguishers/:id` |
| `stats()` | GET | `/extinguishers/stats` |

**`inspectionAPI`**

| Function | HTTP | Path |
|---|---|---|
| `create(data)` | POST | `/inspections` |
| `list(params)` | GET | `/inspections` |
| `get(id)` | GET | `/inspections/:id` |
| `update(id, data)` | PUT | `/inspections/:id` |

**`maintenanceAPI`**

| Function | HTTP | Path |
|---|---|---|
| `create(data)` | POST | `/maintenance` |
| `list(params)` | GET | `/maintenance` |
| `get(id)` | GET | `/maintenance/:id` |
| `update(id, data)` | PUT | `/maintenance/:id` |
| `updateStatus(id, status)` | PATCH | `/maintenance/:id/status` |

**`notificationAPI`**

| Function | HTTP | Path |
|---|---|---|
| `list(params)` | GET | `/notifications` |
| `markRead(id)` | PATCH | `/notifications/:id/read` |
| `markAllRead()` | PATCH | `/notifications/read-all` |
| `getEscalations(params)` | GET | `/notifications/escalations` |
| `resolveEscalation(id, notes)` | PATCH | `/notifications/escalations/:id/resolve` |
| `triggerCheck()` | POST | `/notifications/trigger-check` |

**`reportAPI`**

| Function | HTTP | Path |
|---|---|---|
| `summary()` | GET | `/reports/summary` |
| `expired(params)` | GET | `/reports/expired` |
| `expiringSoon(params)` | GET | `/reports/expiring-soon` |
| `customers(params)` | GET | `/reports/customers` |
| `inspections(params)` | GET | `/reports/inspections` |
| `inspectionStatusSummary()` | GET | `/reports/inspections/status-summary` |
| `maintenance(params)` | GET | `/reports/maintenance` |
| `maintenanceFrequency()` | GET | `/reports/maintenance/frequency` |
| `compliance(params)` | GET | `/reports/compliance` |
| `inventorySummary()` | GET | `/reports/inventory/summary` |
| `audit(params)` | GET | `/reports/audit` |
| `downloadReport(type, format, params)` | GET | `/reports/:type?format=...` (blob) |

---

### 10.5 Routing & Guards

**File:** `frontend/src/App.js`

Two route guard components:

**`ProtectedRoute`** — Redirects to `/login` if not authenticated. Accepts `adminOnly` prop which redirects non-admins to `/dashboard`.

**`PublicRoute`** — Redirects to `/dashboard` if already logged in (prevents accessing login/register when authenticated).

Route structure:
```
/login, /register, /forgot-password, /reset-password   ← PublicRoute
/ → /dashboard                                          ← ProtectedRoute > Layout > Outlet
  /dashboard
  /customers
  /extinguishers
  /inspections
  /maintenance
  /reports             ← adminOnly
  /audit-logs          ← adminOnly
  /escalations         ← adminOnly
  /users               ← adminOnly
* → /dashboard
```

---

### 10.6 Styling (`index.css`)

The entire design system is in a single CSS file. It uses CSS custom properties (variables) defined on `:root`:

```css
--bg: #140d0b                    /* page background */
--bg-elevated: #201210           /* cards, modals */
--bg-card: rgba(39, 22, 18, 0.9) /* table backgrounds */
--accent: #d9472b                /* primary orange-red */
--accent-strong: #ff5b2e         /* hover state */
--success: #7bc47f
--warning: #f3b24f
--danger: #ff7560
--sand: #f2cf9b                  /* section titles */
--text: #fff4ea                  /* primary text */
--text-muted: #c7aa96            /* labels, subtitles */
--border: rgba(255,209,184,0.12) /* subtle borders */
--border-strong: rgba(255,209,184,0.24)
```

Key CSS classes to know when editing:

| Class | Purpose |
|---|---|
| `.modal-overlay` | Fixed fullscreen backdrop (z-index 9000) |
| `.modal` / `.modal-lg` | Dialog panel, scrollable, max 620px or 860px wide |
| `.modal-header` | Sticky title bar inside modal |
| `.modal-footer` | Sticky button row at modal bottom |
| `.modal-body` | Scrollable content area with 24px padding |
| `.modal-section` | Labelled group box inside modal body |
| `.form-group` | Label + input stack |
| `.form-row` | 2-column form grid |
| `.form-row-3` | 3-column form grid |
| `.form-control` | Input, select, textarea styling |
| `.form-label` | Small caps uppercase label |
| `.btn-primary` | Orange action button |
| `.btn-secondary` | Ghost button |
| `.btn-icon` | Small square icon button |
| `.table-wrapper` | Rounded bordered table container |
| `.detail-grid` | 2-column key/value display grid |
| `.detail-item` | Individual key/value card in detail-grid |
| `.badge` / `.badge-green` etc | Status pills |
| `.page-header` | Page title + action button row |
| `.search-bar` | Filter/search row beneath page header |
| `.sidebar` | Left navigation (fixed, 280px) |
| `.main-content` | Right content area (margin-left: 280px) |
| `.topbar` | Sticky header bar (height 78px, z-index 50) |
| `.notif-panel` | Slide-in notification drawer (fixed right) |

---

## 11. CI/CD — GitHub Actions

**File:** `.github/workflows/docker-build.yml`

### Triggers

- Push to `main` or `master` (ignores `*.md` and `.gitignore` changes)
- Pull request to `main` or `master` (ignores `*.md`)
- Manual via `workflow_dispatch`

### Job 1 — `detect-changes`

Uses `dorny/paths-filter@v3` to check which directories changed. Produces one boolean output per service. This prevents rebuilding images that haven't changed.

Path filters:
- `api-gateway/**` and `swagger.yaml` → `api-gateway` flag
- `services/auth-service/**` → `auth-service` flag
- `services/entry-service/**` → `customer-service` flag
- `services/extinguisher-service/**` → `extinguisher-service` flag
- `services/notification-service/**` → `notification-service` flag
- `services/report-service/**` → `report-service` flag
- `frontend/**` → `frontend` flag

### Job 2 — `build-and-push`

Runs on push to main/master (not on PRs). Builds all 7 images in parallel (matrix strategy, `fail-fast: false`).

Steps per service:
1. Checkout code
2. Login to `ghcr.io` with `GITHUB_TOKEN`
3. Set up Docker Buildx
4. Extract metadata (image tags)
5. Build and push with layer caching from GitHub Actions cache

**Image tags generated:**
- `latest` (only on default branch)
- `<branch>-<sha>` (e.g. `main-abc1234`)
- `<branch>` (e.g. `main`)
- `<version>` and `<major>.<minor>` (if commit is tagged with semver)

**Published images:**
```
ghcr.io/<owner>/femcs-api-gateway
ghcr.io/<owner>/femcs-auth-service
ghcr.io/<owner>/femcs-customer-service
ghcr.io/<owner>/femcs-extinguisher-service
ghcr.io/<owner>/femcs-notification-service
ghcr.io/<owner>/femcs-report-service
ghcr.io/<owner>/femcs-frontend
```

**Build args passed to each Dockerfile:**
- `BUILD_DATE` — commit timestamp
- `GIT_SHA` — commit hash
- `SERVICE_PORT` — service's port number

### Job 3 — `build-pr`

Runs only on pull requests. Builds only services whose files changed (`if: matrix.changed == 'true'`). Does **not** push. Tags images as `femcs-<service>:pr-<number>`. Used to catch Dockerfile errors before merge.

---

## 12. Docker Compose — Full Stack

**File:** `docker-compose.yml`

### Services

| Service name | Build context | Ports | Depends on |
|---|---|---|---|
| `postgres` | `postgres:15-alpine` image | `5432:5432` | — |
| `auth-service` | `./services/auth-service` | `5001:5001` | postgres (healthy) |
| `customer-service` | `./services/entry-service` | `5002:5002` | postgres (healthy) |
| `extinguisher-service` | `./services/extinguisher-service` | `5003:5003` | postgres (healthy) |
| `notification-service` | `./services/notification-service` | `5004:5004` | postgres (healthy) |
| `report-service` | `./services/report-service` | `5005:5005` | postgres (healthy) |
| `api-gateway` | `./api-gateway` | `5000:5000` | all services (healthy) |
| `frontend` | `./frontend` | `3000:3000` | api-gateway (healthy) |

### Postgres setup

```
POSTGRES_DB: femcs_db
POSTGRES_USER: femcs
POSTGRES_PASSWORD: femcs_secret
```

Init files mounted:
```
./schema.sql  → /docker-entrypoint-initdb.d/01-schema.sql
./migrate.sql → /docker-entrypoint-initdb.d/02-migrate.sql
```

### Networking

All containers are on bridge network `femcs-net`. Services reference each other by service name (e.g. `http://auth-service:5001`).

### Volume

`pgdata` is a named Docker volume. Data persists across `docker compose down` (but is destroyed with `docker compose down -v`).

### Frontend build arg

```
REACT_APP_API_URL: http://localhost:5000/api
```

This is baked into the React production build at build time.

---

## 13. User Roles & Permissions

| Action | `user` | `inspector` | `admin` |
|---|---|---|---|
| Login / register | ✓ | ✓ | ✓ |
| View extinguishers, customers | ✓ | ✓ | ✓ |
| Schedule inspection | ✓ | ✓ | ✓ |
| Record inspection outcome / findings | — | ✓ | ✓ |
| Create/edit extinguishers | ✓ | ✓ | ✓ |
| Delete extinguishers | — | — | ✓ |
| Create/edit maintenance | ✓ | ✓ | ✓ |
| Delete customers | — | — | ✓ |
| View reports | — | — | ✓ |
| View audit logs | — | — | ✓ |
| View / resolve escalations | — | ✓ | ✓ |
| Manage users (role, active) | — | — | ✓ |
| Trigger manual expiry check | — | — | ✓ |

---

## 14. Key Flows (End to End)

### User logs in

1. Browser POSTs `{email, password}` to `POST /api/auth/login`
2. Gateway forwards to auth-service:5001
3. Auth service verifies password with bcrypt, signs JWT (1 day expiry), writes audit log
4. Returns `{token, user}`
5. Frontend stores token in `localStorage`, sets `AuthContext.user`, redirects to `/dashboard`
6. All subsequent requests include `Authorization: Bearer <token>` from the Axios interceptor

### Registering an extinguisher

1. User fills the Add Extinguisher form and clicks Register
2. Frontend calls `extinguisherAPI.create(form)` → `POST /api/extinguishers`
3. Gateway proxies to extinguisher-service:5003
4. Service validates body with Joi, queries customer existence, generates `EXT-######` code
5. Inserts row in `extinguishers`
6. If customer has email, sends registration confirmation email
7. Returns the created record
8. Frontend shows success toast, closes modal, refreshes list

### Daily expiry check

1. `node-cron` triggers `checkExpiryAndNotify` at 08:00 inside notification-service
2. Queries all non-decommissioned extinguishers + customer info
3. For each unit, calculates `daysUntilExpiry = expiry_date - today`
4. Updates `compliance_status` and `status` in DB
5. For thresholds 90/60/30/7: inserts a notification row and sends email (once per threshold per unit)

### Password reset

1. User enters email on ForgotPasswordPage
2. `POST /api/auth/forgot-password` → auth-service generates 6-digit OTP, expires in 10 minutes, stores in `otps` table, sends email
3. User enters email + OTP + new password on ResetPasswordPage
4. `POST /api/auth/reset-password` → validates OTP (unused, not expired), updates password hash, marks OTP as used

---

## 15. Common Maintenance Tasks

### Add a new user / reset a password

Either use the Register page (self-service), or insert directly:

```sql
-- Generate a bcrypt hash for "Admin@123" using any bcrypt tool at cost 12
UPDATE users
SET password = '$2a$12$<hash>', role = 'admin', is_active = true
WHERE email = 'someone@example.com';
```

### Run seed data

```bash
docker exec -i <postgres_container_name> psql -U femcs femcs_db < seed.sql
```

### Apply database migration changes

Simply update `migrate.sql` with your idempotent `ALTER TABLE` statements and rebuild. The file runs automatically on next `docker compose up --build` against a fresh volume. For an existing running database, connect and run manually:

```bash
docker exec -i <postgres_container> psql -U femcs femcs_db < migrate.sql
```

### Add a new endpoint

1. Add the route in the appropriate service's route file
2. If it's a new path prefix, add a proxy rule in `api-gateway/src/index.js`
3. Document it in `swagger.yaml`
4. Add the API function in `frontend/src/services/api.js`
5. Use it in the relevant page component

### Add a new frontend page

1. Create `frontend/src/pages/NewPage.js`
2. Add it to `App.js` routes (with `ProtectedRoute` if needed)
3. Add a nav item in `Layout.js` `navItems` or `adminItems` array
4. Add the page to the `pageTitle` lookup in `Layout.js`

### Change SMTP settings

Update the root `.env` file and restart:

```bash
docker compose down
docker compose up --build -d
```

### Rebuild only one service

```bash
docker compose up --build auth-service -d
```

### View logs for a specific service

```bash
docker compose logs -f notification-service
```

### Check the database directly

```bash
docker exec -it <postgres_container> psql -U femcs femcs_db
```

---

## 16. Default Credentials

The `schema.sql` inserts one default admin account:

| Field | Value |
|---|---|
| Email | `admin@femcs.rw` |
| Password | `Admin@123` |
| Role | `admin` |
| ID | `11111111-1111-1111-1111-111111111111` |

**Change this password immediately in any non-demo environment** — either via the Change Password button in the sidebar or directly in the database.

---

*Document generated from source at `C:\Users\RCA\ne_prep\NE_prep\restfull\FEMS` — covers all files as of the date of this export.*
