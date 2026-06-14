# 🚀 FireShield Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git (optional)

---

## 📦 Installation Steps

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install service dependencies
cd api-gateway && npm install && cd ..
cd services/auth-service && npm install && cd ../..
cd services/customer-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..
cd services/escalation-service && npm install && cd ../..
cd services/email-service && npm install && cd ../..
cd frontend && npm install && cd ..
```

### 2. Configure Environment Variables

All `.env` files are already configured. Just verify the database password matches your PostgreSQL setup:

**Root `.env`:**
```env
DB_PASSWORD=postgres123
```

**Update this password in ALL service `.env` files if different:**
- `services/auth-service/.env`
- `services/customer-service/.env`
- `services/notification-service/.env`
- `services/escalation-service/.env`

### 3. Setup Database

#### Option A: Using the Script (Recommended)
```bash
# Run from project root
scripts\seed-database.bat
```

#### Option B: Manual Setup
```bash
# Create database
psql -U postgres -c "CREATE DATABASE fire_ext_db;"

# Run migrations
psql -U postgres -d fire_ext_db -f database/migrations/001_initial_schema.sql

# Seed admin users
psql -U postgres -d fire_ext_db -f database/seeds/001_seed_admin.sql
```

### 4. Configure Email Service (Optional for Development)

The email service is already configured with Gmail SMTP. For development, emails will work with the provided credentials.

For production, update `services/email-service/.env`:
```env
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

### 5. Start All Services
```bash
npm run dev
```

This starts:
- API Gateway (port 3000)
- Auth Service (port 3001)
- Customer Service (port 3002)
- Notification Service (port 3003)
- Escalation Service (port 3004)
- Email Service (port 3005)
- Frontend (port 3006)

---

## 🔐 Login Credentials

### Admin Account
- **URL:** http://localhost:3006/auth/login
- **Email:** admin@fireshield.com
- **Password:** Admin@2024
- **Access:** Full system access

### Staff Account
- **Email:** staff@fireshield.com
- **Password:** Staff@2024
- **Access:** Manage customers and extinguishers

### Customer Account (Test)
- **Email:** customer@example.com
- **Password:** Customer@2024
- **Access:** View own extinguishers only

---

## 🎯 Testing the Application

### 1. Test Registration Flow
1. Go to http://localhost:3006/auth/register
2. Fill in the registration form:
   - Name: Test User
   - Email: test@example.com
   - Phone: +250788999999
   - National ID: 1234567890123
   - Password: Test@2024
3. Submit → Check email for OTP (or check email service console logs)
4. Enter OTP → Redirected to dashboard

### 2. Test Login Flow
1. Go to http://localhost:3006/auth/login
2. Enter email and password
3. Submit → OTP sent to email
4. Enter OTP → Redirected to dashboard

### 3. Test Admin Features
1. Login as admin
2. Navigate to:
   - **Dashboard:** View system stats
   - **Customers:** Manage customer accounts
   - **Extinguishers:** Register new purchases, view expiring items
   - **Notifications:** View notification history
   - **Escalations:** Manage compliance escalations

---

## 📊 Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                         │
├─────────────────────────────────────────────────────────────┤
│ 1. User fills registration form                             │
│ 2. Account created (is_verified = false)                    │
│ 3. OTP sent to email (6-digit code, expires in 10 min)     │
│ 4. User enters OTP                                          │
│ 5. Account verified (is_verified = true)                    │
│ 6. JWT token issued → Redirected to dashboard              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW (2FA)                        │
├─────────────────────────────────────────────────────────────┤
│ 1. User enters email + password                             │
│ 2. Password verified                                        │
│ 3. OTP sent to email (2FA)                                  │
│ 4. User enters OTP                                          │
│ 5. JWT token issued → Redirected to dashboard              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   NOTIFICATION SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│ • Cron job runs daily at 08:00 (Africa/Kigali timezone)    │
│ • Scans all extinguishers for expiry dates                  │
│ • Sends email notifications at:                             │
│   - 30 days before expiry                                   │
│   - 14 days before expiry                                   │
│   - 7 days before expiry                                    │
│   - 1 day before expiry                                     │
│   - On expiry date                                          │
│ • Customer can acknowledge notification                     │
│ • Unacknowledged → Auto-escalation after 30 days           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   ESCALATION WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Open → Initial escalation created                        │
│ 2. In Review → Staff reviewing case                         │
│ 3. Notified Authority → Sent to regulatory body             │
│ 4. Resolved → Customer renewed extinguisher                 │
│ 5. Closed → Case closed                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Common Tasks

### Register a New Extinguisher Purchase
1. Login as admin/staff
2. Go to **Extinguishers** → **Register New Purchase**
3. Fill form:
   - Select customer
   - Quantity
   - Serial numbers (comma-separated)
   - Purchase date
   - Expiry date (typically 1 year from purchase)
4. Submit → Notification system will track expiry

### View Expiring Extinguishers
1. Login as admin/staff
2. Go to **Dashboard** → See "Expiring (30d)" card
3. Or go to **Extinguishers** → Filter by status "expiring_soon"

### Manage Escalations
1. Login as admin/staff
2. Go to **Escalations**
3. View open cases
4. Click on escalation to:
   - Update status
   - Add notes
   - Add authority reference
   - Mark as resolved

---

## 🐛 Troubleshooting

### Services won't start
```bash
# Check if ports are already in use
netstat -ano | findstr "3000 3001 3002 3003 3004 3005 3006"

# Kill processes if needed
taskkill /PID <process_id> /F
```

### Database connection errors
1. Verify PostgreSQL is running:
   ```bash
   psql -U postgres -c "SELECT version();"
   ```
2. Check database exists:
   ```bash
   psql -U postgres -c "\l" | findstr fire_ext_db
   ```
3. Verify password in all `.env` files matches PostgreSQL password

### OTP not received
1. Check email service logs in terminal
2. For development, OTP is logged to console
3. Verify SMTP credentials in `services/email-service/.env`
4. Check spam folder

### Can't login as admin
1. Verify seed script ran successfully:
   ```bash
   psql -U postgres -d fire_ext_db -c "SELECT email, role, is_verified FROM users WHERE role='admin';"
   ```
2. Should show: `admin@fireshield.com | admin | t`
3. If not, re-run seed script

---

## 📁 Project Structure

```
fire-ext-system/
├── api-gateway/              # API Gateway (port 3000)
├── services/
│   ├── auth-service/         # Authentication & OTP (port 3001)
│   ├── customer-service/     # Customer management (port 3002)
│   ├── notification-service/ # Expiry notifications (port 3003)
│   ├── escalation-service/   # Escalation management (port 3004)
│   └── email-service/        # Email sending (port 3005)
├── frontend/                 # Next.js frontend (port 3006)
├── database/
│   ├── migrations/           # SQL schema migrations
│   └── seeds/                # Seed data (admin users)
├── scripts/                  # Utility scripts
├── .env                      # Root environment config
├── ADMIN_CREDENTIALS.md      # Admin login details
└── QUICKSTART.md            # This file
```

---

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Change default staff password
- [ ] Update JWT_SECRET in all service `.env` files
- [ ] Configure proper SMTP credentials for production
- [ ] Enable HTTPS in production
- [ ] Set up proper firewall rules
- [ ] Regular database backups
- [ ] Monitor audit logs

---

## 📞 Need Help?

- Check `ADMIN_CREDENTIALS.md` for detailed documentation
- Review service logs in terminal for errors
- Verify all services are running on correct ports
- Ensure database migrations completed successfully

---

## 🎉 You're Ready!

Visit http://localhost:3006 and login with admin credentials to start managing fire extinguishers!
