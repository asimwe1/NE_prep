# Navigation Flow Diagram

## 🔄 Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEW USER JOURNEY                         │
└─────────────────────────────────────────────────────────────────┘

    START: User visits website (/)
           │
           ├─ Not Authenticated? → Redirect to /auth/login
           │
           v
    ┌──────────────────┐
    │  LOGIN PAGE      │
    │  /auth/login     │
    └──────────────────┘
           │
           │ Click "Register" link
           v
    ┌──────────────────────────────────────┐
    │  REGISTRATION PAGE                    │
    │  /auth/register                       │
    │                                       │
    │  STEP 1: Registration Form            │
    │  ├─ Name                              │
    │  ├─ Email                             │
    │  ├─ Phone                             │
    │  ├─ National ID                       │
    │  ├─ Address (optional)                │
    │  ├─ Password                          │
    │  └─ Confirm Password                  │
    │                                       │
    │  [Create Account] ──────────────────┐ │
    └──────────────────────────────────────┘ │
                                             │
                    ┌────────────────────────┘
                    │ Submit Registration
                    v
              📧 OTP Email Sent
                    │
                    v
    ┌──────────────────────────────────────┐
    │  REGISTRATION PAGE                    │
    │  /auth/register                       │
    │                                       │
    │  STEP 2: Email Verification (OTP)     │
    │  ├─ "Hi [Name]!"                      │
    │  ├─ "Enter code sent to [email]"      │
    │  └─ [6-digit OTP input]               │
    │                                       │
    │  [Verify Email & Continue] ─────────┐ │
    │  [Resend Code]                       │ │
    └──────────────────────────────────────┘ │
                                             │
                    ┌────────────────────────┘
                    │ OTP Verified ✅
                    v
    ┌──────────────────────────────────────┐
    │  LOGIN PAGE                           │
    │  /auth/login?verified=true            │
    │                                       │
    │  ✅ Success Message:                  │
    │  "Email verified successfully!        │
    │   Please sign in to continue."        │
    │                                       │
    │  STEP 1: Enter Credentials            │
    │  ├─ Email                             │
    │  └─ Password                          │
    │                                       │
    │  [Continue] ─────────────────────────┐│
    └──────────────────────────────────────┘│
                                             │
                    ┌────────────────────────┘
                    │ Credentials Valid
                    v
              📧 Login OTP Email Sent
                    │
                    v
    ┌──────────────────────────────────────┐
    │  LOGIN PAGE                           │
    │  /auth/login                          │
    │                                       │
    │  STEP 2: Enter OTP                    │
    │  ├─ "Code sent to [email]"            │
    │  └─ [6-digit OTP input]               │
    │                                       │
    │  [Verify & Sign In] ─────────────────┐│
    │  [Resend Code] [← Back]              ││
    └──────────────────────────────────────┘│
                                             │
                    ┌────────────────────────┘
                    │ Login OTP Verified ✅
                    v
         ┌──────────────────────┐
         │  Role-Based Routing   │
         └──────────────────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
         v          v          v
    ┌────────┐ ┌────────┐ ┌──────────┐
    │ ADMIN  │ │ STAFF  │ │ CUSTOMER │
    │   ↓    │ │   ↓    │ │    ↓     │
    │ /dash  │ │ /dash  │ │  /dash   │
    └────────┘ └────────┘ └──────────┘
         │          │          │
         └──────────┼──────────┘
                    v
    ┌──────────────────────────────────────┐
    │         DASHBOARD PAGE                │
    │         /dashboard                    │
    │                                       │
    │  Welcome back, [Name] 👋              │
    │                                       │
    │  [Stats & Content based on role]      │
    └──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    RETURNING USER JOURNEY                        │
└─────────────────────────────────────────────────────────────────┘

    START: User visits website (/)
           │
           ├─ Not Authenticated? → Redirect to /auth/login
           │
           v
    ┌──────────────────────────────────────┐
    │  LOGIN PAGE                           │
    │  /auth/login                          │
    │                                       │
    │  STEP 1: Enter Credentials            │
    │  ├─ Email                             │
    │  └─ Password                          │
    │                                       │
    │  [Continue] ─────────────────────────┐│
    └──────────────────────────────────────┘│
                                             │
                    ┌────────────────────────┘
                    v
              📧 Login OTP Sent
                    │
                    v
    ┌──────────────────────────────────────┐
    │  LOGIN PAGE                           │
    │  /auth/login                          │
    │                                       │
    │  STEP 2: Enter OTP                    │
    │  └─ [6-digit OTP input]               │
    │                                       │
    │  [Verify & Sign In] ─────────────────┐│
    └──────────────────────────────────────┘│
                                             │
                    ┌────────────────────────┘
                    │ Login Successful ✅
                    v
              Role-Based Dashboard
                    │
                    v
    ┌──────────────────────────────────────┐
    │         DASHBOARD PAGE                │
    │         /dashboard                    │
    └──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                 AUTHENTICATED USER JOURNEY                       │
└─────────────────────────────────────────────────────────────────┘

    START: Logged-in user visits website (/)
           │
           ├─ Already Authenticated? → Redirect to /dashboard
           │
           v
    ┌──────────────────────────────────────┐
    │         DASHBOARD PAGE                │
    │         /dashboard                    │
    └──────────────────────────────────────┘

    If user tries to access /auth/login or /auth/register:
           │
           ├─ Already Authenticated? → Redirect to /dashboard
           │
           v
    ┌──────────────────────────────────────┐
    │         DASHBOARD PAGE                │
    │         /dashboard                    │
    └──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION GUARDS                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────────────────────────┐
│   Root Page     │────▶│ Authenticated? → /dashboard          │
│   /             │     │ Not Authenticated? → /auth/login     │
└─────────────────┘     └──────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────────────────────────┐
│  Register Page  │────▶│ Authenticated? → /dashboard          │
│ /auth/register  │     │ Not Authenticated? → Show form       │
└─────────────────┘     └──────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────────────────────────┐
│   Login Page    │────▶│ Authenticated? → /dashboard          │
│  /auth/login    │     │ Not Authenticated? → Show form       │
└─────────────────┘     └──────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────────────────────────┐
│ Dashboard Page  │────▶│ Authenticated? → Show dashboard      │
│   /dashboard    │     │ Not Authenticated? → /auth/login     │
└─────────────────┘     └──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                         KEY FEATURES                             │
└─────────────────────────────────────────────────────────────────┘

✅ Email verification required before login
✅ Two-factor authentication with OTP
✅ Role-based dashboard routing
✅ Proper authentication guards on all pages
✅ Success messages and error handling
✅ Resend OTP functionality
✅ Back navigation in login flow
✅ Prevents duplicate authentication
