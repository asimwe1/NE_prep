# Fire Extinguisher Management System

This project is a RESTful microservices-based Fire Extinguisher Management System aligned to the `Fire_Extinguisher_Template/system.md` brief. It covers user management, JWT authentication, role-based authorization, extinguisher registration, inspection scheduling, maintenance logging, notifications, and reporting with CSV/PDF export.

## Services

- `api-gateway` on `5000`: routing, rate limiting, Swagger docs
- `auth-service` on `5001`: registration, login, profile, password recovery
- `entry-service` on `5002`: facility/customer registry used to associate extinguishers with sites
- `extinguisher-service` on `5003`: extinguisher CRUD, inspections, maintenance
- `notification-service` on `5004`: reminders, escalations, email notifications
- `report-service` on `5005`: inventory, inspection, compliance, maintenance, audit reports
- `frontend` on `3000`: React dashboard

## Required Roles

- `admin`
- `inspector`
- `user`

## Extinguisher Model

Supported required extinguisher fields:

- serial number
- location
- type: `Water`, `CO2`, `Foam`, `Dry Chemical`
- size: `2.5 lb`, `5 lb`, `9 lb`, `12 lb`
- installation date
- expiry date
- status

The project keeps the existing facility registry so each extinguisher is attached to a site/building owner record.

## Email Configuration

The services now support either `MAIL_*` or legacy `SMTP_*` variables. Use `.env` files per service and keep real credentials out of source control.

Example:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
EMAIL_FROM=Fire Extinguisher System <noreply@fems.local>
```

## Main API Coverage

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/validate`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `GET|POST|PUT|DELETE /api/extinguishers`
- `GET|POST /api/inspections`
- `GET|POST /api/maintenance`
- `GET /api/reports/expired`
- `GET /api/reports/expiring-soon`
- `GET /api/reports/compliance`
- `GET /api/reports/inventory/summary`
- `GET /api/reports/inspections/status-summary`
- `GET /api/reports/maintenance/frequency`

## Build and Checks Run

Executed in this workspace:

- `node --check` on modified backend route files
- `npm install` in `frontend`
- `npm run build` in `frontend`
- `schema.sql`, `migrate.sql`, and `seed.sql` applied to local `femcs_db`
- database connectivity verified from `auth-service`, `entry-service`, `extinguisher-service`, `notification-service`, and `report-service`

## Notes

- Database changes are reflected in `schema.sql`, incremental updates in `migrate.sql`, and starter data in `seed.sql`.
- The frontend report screen now exports both CSV and PDF.
- The inspection workflow now supports scheduling with date and time.
