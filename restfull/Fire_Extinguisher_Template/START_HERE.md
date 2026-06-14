# 🔥 FireShield - Fire Extinguisher Management System

## 🚀 Quick Start (3 Steps)

### 1️⃣ Setup Database
```bash
scripts\seed-database.bat
```

### 2️⃣ Start All Services
```bash
npm run dev
```

### 3️⃣ Login
Open http://localhost:3006/auth/login

**Admin Login:**
- Email: `admin@fireshield.com`
- Password: `Admin@2024`

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **QUICKSTART.md** | Complete installation and setup guide |
| **ADMIN_CREDENTIALS.md** | All login credentials and system documentation |
| **FIXES_APPLIED.md** | Summary of all fixes and improvements |

---

## 🔐 Default Accounts

### Administrator
- **Email:** admin@fireshield.com
- **Password:** Admin@2024
- **Access:** Full system control

### Staff Member
- **Email:** staff@fireshield.com
- **Password:** Staff@2024
- **Access:** Manage customers & extinguishers

### Test Customer
- **Email:** customer@example.com
- **Password:** Customer@2024
- **Access:** View own extinguishers

⚠️ **Change these passwords in production!**

---

## 🎯 Application Features

### ✅ User Management
- Role-based access (Admin, Staff, Customer)
- Secure registration with email verification
- Two-factor authentication (OTP via email)
- Password requirements enforced

### ✅ Extinguisher Tracking
- Register fire extinguisher purchases
- Track serial numbers and expiry dates
- Automatic expiry notifications
- Status tracking (active, expiring, expired)

### ✅ Notification System
- Automated daily scans (08:00 Africa/Kigali)
- Email alerts at 30, 14, 7, 1 days before expiry
- Customer acknowledgment tracking
- Notification history and statistics

### ✅ Escalation Management
- Auto-escalation for non-compliance
- Manual escalation by staff/admin
- Authority notification system
- Case status tracking and resolution

### ✅ Reports & Analytics
- Dashboard with real-time statistics
- Expiring extinguishers report
- Notification statistics
- Escalation tracking
- Customer compliance reports

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│                   http://localhost:3006                  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  API Gateway (Express)                   │
│                   http://localhost:3000                  │
└─────┬──────┬──────┬──────┬──────┬──────────────────────┘
      │      │      │      │      │
      ▼      ▼      ▼      ▼      ▼
   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
   │Auth│ │Cust│ │Notf│ │Esc │ │Mail│
   │3001│ │3002│ │3003│ │3004│ │3005│
   └─┬──┘ └─┬──┘ └─┬──┘ └─┬──┘ └────┘
     │      │      │      │
     └──────┴──────┴──────┴─────────┐
                                     ▼
                            ┌─────────────────┐
                            │   PostgreSQL    │
                            │  fire_ext_db    │
                            └─────────────────┘
```

---

## 🔄 Application Flow

### Registration → Verification → Login → Dashboard

```
1. REGISTER
   ├─ Fill form (name, email, phone, national_id, password)
   ├─ Account created (unverified)
   └─ OTP sent to email

2. VERIFY EMAIL
   ├─ Enter 6-digit OTP
   ├─ Account verified
   └─ JWT token issued

3. LOGIN (2FA)
   ├─ Enter email + password
   ├─ OTP sent to email
   ├─ Enter OTP
   └─ JWT token issued

4. DASHBOARD
   ├─ Admin/Staff: Full system view
   └─ Customer: Personal view only
```

---

## 📊 Reports Available

### For Admin/Staff:
1. **Dashboard Statistics**
   - Expiring extinguishers (30 days)
   - Notifications sent/acknowledged
   - Open escalations

2. **Expiring Extinguishers Report**
   - Filter by days until expiry
   - Export to CSV (future)

3. **Notification Statistics**
   - Sent, delivered, acknowledged, failed
   - Grouped by status

4. **Escalation Reports**
   - Open, in review, resolved, closed
   - Authority notification tracking

5. **Customer Compliance**
   - Individual customer reports
   - Extinguisher status
   - Notification history
   - Escalation records

---

## 🛠️ Troubleshooting

### Services won't start?
```bash
# Check if ports are in use
netstat -ano | findstr "3000 3001 3002 3003 3004 3005 3006"
```

### Database errors?
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check database exists
psql -U postgres -c "\l" | findstr fire_ext_db

# Re-run migrations
psql -U postgres -d fire_ext_db -f database/migrations/001_initial_schema.sql
```

### Can't login?
1. Verify seed script ran: `psql -U postgres -d fire_ext_db -c "SELECT email, role FROM users;"`
2. Check email service is running (port 3005)
3. Look for OTP in email service console logs

### OTP not received?
- Check email service logs in terminal
- Verify SMTP credentials in `services/email-service/.env`
- Check spam folder
- For development, OTP is logged to console

---

## 📁 Project Structure

```
fire-ext-system/
├── api-gateway/              # API Gateway (port 3000)
├── services/
│   ├── auth-service/         # Authentication (port 3001)
│   ├── customer-service/     # Customers (port 3002)
│   ├── notification-service/ # Notifications (port 3003)
│   ├── escalation-service/   # Escalations (port 3004)
│   └── email-service/        # Emails (port 3005)
├── frontend/                 # Next.js UI (port 3006)
├── database/
│   ├── migrations/           # SQL schemas
│   └── seeds/                # Admin users
├── scripts/                  # Setup scripts
├── START_HERE.md            # This file
├── QUICKSTART.md            # Detailed setup guide
├── ADMIN_CREDENTIALS.md     # Full documentation
└── FIXES_APPLIED.md         # Changes summary
```

---

## 🔒 Security Features

✅ **Password Requirements**
- Minimum 8 characters
- 1 uppercase letter
- 1 number
- Bcrypt hashing (12 rounds)

✅ **Two-Factor Authentication**
- OTP required for all logins
- 10-minute expiry
- 5 attempt limit

✅ **Role-Based Access Control**
- Customer: Own data only
- Staff: Manage operations
- Admin: Full system access

✅ **Audit Logging**
- All actions logged
- IP tracking
- Timestamp records

---

## 🎉 You're All Set!

1. ✅ Database seeded with admin users
2. ✅ All services configured
3. ✅ Email notifications working
4. ✅ Authentication flow tested
5. ✅ Reports available

**Start the application:**
```bash
npm run dev
```

**Login at:** http://localhost:3006/auth/login

**Need help?** Check `QUICKSTART.md` or `ADMIN_CREDENTIALS.md`

---

## 📞 Support

For detailed documentation, see:
- **QUICKSTART.md** - Installation guide
- **ADMIN_CREDENTIALS.md** - Complete system documentation
- **FIXES_APPLIED.md** - Technical changes

---

**Happy Fire Safety Management! 🔥🧯**
