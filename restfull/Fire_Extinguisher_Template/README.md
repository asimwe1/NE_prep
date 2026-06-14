# 🔥 Fire Extinguisher Management System

A microservice-based system for tracking fire extinguisher purchases, managing expiry notifications, and escalating non-compliance cases.

## Tech Stack
- **Backend:** Node.js + Express + TypeScript
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Database:** PostgreSQL
- **Auth:** JWT + OTP (email-based)
- **Email:** Nodemailer
- **Scheduler:** node-cron

## Services
| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 3000 | Request routing, JWT verification, rate limiting |
| auth-service | 3001 | Registration, login, OTP, JWT |
| customer-service | 3002 | Customer CRUD, extinguisher records |
| notification-service | 3003 | Expiry tracking, notifications, acknowledgements |
| escalation-service | 3004 | Non-response escalation, authority records |
| email-service | 3005 | Email sending via Nodemailer |
| frontend | 3006 | Next.js customer & admin portal |

## Prerequisites
- Node.js >= 18
- PostgreSQL >= 14 (running locally)
- npm >= 9

## Quick Start

### 1. Database Setup
```bash
# Create the database
psql -U postgres -c "CREATE DATABASE fire_ext_db;"

# Run migrations
npm run db:migrate
```

### 2. Environment Setup
Copy `.env.example` to `.env` in each service directory and fill values.

### 3. Install & Run All Services
```bash
npm run setup      # installs all deps
npm run dev        # starts all services concurrently
```

Or run individually:
```bash
cd services/auth-service && npm run dev
cd services/customer-service && npm run dev
# etc.
```

## Project Structure
```
fire-ext-system/
├── api-gateway/          # Reverse proxy + JWT guard
├── services/
│   ├── auth-service/     # OTP auth, JWT
│   ├── customer-service/ # Customers + extinguishers
│   ├── notification-service/ # Expiry alerts + ack
│   ├── escalation-service/   # Policy escalation
│   └── email-service/    # Nodemailer wrapper
├── frontend/             # Next.js 14 TypeScript app
├── database/
│   └── migrations/       # SQL migration files
├── shared/               # Shared types & utils
└── scripts/              # DB seed, setup scripts
```
