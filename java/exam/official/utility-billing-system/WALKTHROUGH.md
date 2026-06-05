# Utility Billing System Walkthrough

## 1. Purpose of the system

This application manages utility billing for:

- `WASAC` water services
- `REG` electricity services

It covers the main backend flow for:

- user registration and authentication
- customer profile management
- utility meter assignment
- tariff, tax, and penalty configuration
- monthly meter reading capture
- bill generation
- payment recording
- notification tracking

The API is designed around roles, so different users can only access the parts of the process that match their responsibility.

## 2. Main roles in the system

The system has four security roles:

- `ROLE_ADMIN`
- `ROLE_OPERATOR`
- `ROLE_FINANCE`
- `ROLE_CUSTOMER`

### `ROLE_ADMIN`

Admin is the system controller. Admin can:

- manage users
- create and update customer records
- assign and manage meters
- create tariffs
- create tax configurations
- create penalty configurations
- capture readings
- generate bills
- record payments
- view notifications

Admin is the only role with full access across all business modules.

### `ROLE_OPERATOR`

Operator handles field and operational work. Operator can:

- view meters
- capture meter readings
- view readings
- view customer meters

Operator cannot:

- manage users
- create customers directly
- create tariffs or tax/penalty configs
- generate bills
- record payments

### `ROLE_FINANCE`

Finance handles billing and payment operations. Finance can:

- generate bills
- view bills
- record payments
- view payments

Finance cannot:

- manage users
- assign meters
- capture readings
- create tariff/tax/penalty configurations

### `ROLE_CUSTOMER`

Customer is the end user of the utility service. Customer can:

- register an account
- verify email
- log in
- refresh token
- request password reset
- view own customer profile
- view own meters
- view own bills
- view own notifications

Customer cannot:

- create bills
- record official payments
- capture readings
- create tariffs
- administer other users

## 3. End-to-end business process

The application follows this general process.

### Step 1. User registration and verification

A user starts by registering through `/api/v1/auth/register`.

What happens:

- a `User` account is created
- role is set to `ROLE_CUSTOMER`
- status is set to `INACTIVE`
- an email verification token is generated
- a verification email is sent

The user must verify the email through `/api/v1/auth/verify-email` before the account becomes active.

Important rule:

- unverified users cannot log in successfully

### Step 2. Admin setup

On first startup, the system seeds a default admin:

- email: `admin@example.com`
- password: taken from `ADMIN_DEFAULT_PASSWORD`

Admin logs in and begins preparing the system for use.

### Step 3. Customer profile creation

There are two ways a customer profile can exist:

1. Admin creates it directly through the customer endpoints
2. It is auto-created later during meter assignment if a registered `ROLE_CUSTOMER` user exists but has no customer profile yet

Why this matters:

- `User` represents login/authentication
- `Customer` represents billing/business identity

This separation lets the system support both authentication and business operations cleanly.

### Step 4. Meter assignment

Before readings or bills can exist, a meter must be assigned to a customer.

Admin assigns a meter using:

- meter number
- utility type
- billing mode
- company type
- installation date
- installation address
- customer reference

Important rules:

- meter number must be unique
- each meter belongs to exactly one customer
- the meter starts as `ACTIVE`

This is the point where the real service relationship begins.

### Step 5. Tariff, tax, and penalty setup

Before bills can be generated properly, Admin must configure pricing.

#### Tariff

Tariff defines how usage is priced.

It includes:

- `utilityType`
- `billingMode`
- `tariffType`
- `effectiveStartCycle`
- `effectiveEndCycle`
- `fixedServiceCharge`
- `vatRate`
- optional pricing tiers

Two tariff styles are supported:

- `FLAT`
- `TIER_BASED`

For `FLAT`, pricing comes from the first tier entry.

For `TIER_BASED`, pricing is calculated across multiple usage ranges.

#### Tax configuration

Tax configuration defines tax percentage by utility type and effective month.

#### Penalty configuration

Penalty configuration defines:

- penalty rate
- grace period days
- utility type

Penalty is applied during bill generation if the billing cycle is already past the grace cutoff.

### Step 6. Meter reading capture

Operator or Admin captures monthly readings.

Input includes:

- meter ID
- current reading
- reading date
- billing month in `yyyy-MM`

Important business rules:

- the meter must be active
- billing month cannot be in the future
- only one reading per meter per billing month is allowed
- current reading must be greater than the previous reading

The system automatically computes:

- previous reading
- consumption

This prevents manual tampering with usage calculations.

### Step 7. Bill generation

Finance or Admin generates a bill from:

- a meter
- a billing month
- an already captured reading
- an active tariff for that month

What the system does:

- checks the billing month is not in the future
- checks the customer is active
- loads the reading for that month
- resolves the active tariff
- calculates consumption charge
- adds fixed service charge
- applies VAT
- applies penalty if the grace period has already passed
- creates the bill
- sets due date
- stores bill status as `PENDING`
- triggers notification creation/sending

Important requirement:

- no bill can be generated if there is no reading for that billing month
- no bill can be generated if no active tariff matches the utility type, billing mode, and month

### Step 8. Payment recording

Finance or Admin records a payment against a bill.

Rules enforced by the system:

- the bill must exist
- a fully paid bill cannot be paid again
- payment reference must be unique
- overpayment is rejected

What changes after payment:

- `paidAmount` increases
- `balance` decreases
- bill status becomes:
  - `PARTIALLY_PAID` if balance remains
  - `PAID` if balance reaches zero

When a bill becomes fully paid:

- a payment-received notification is created and email sending is attempted

### Step 9. Notification lifecycle

The system stores notifications in the database before trying to send email.

This means:

- the audit trail is preserved
- failures can still be tracked even if SMTP does not work

Notification statuses include:

- `PENDING`
- `SENT`
- `FAILED`

## 4. What each role can do at each stage

### Registration stage

- `PUBLIC`: register, verify email, login, refresh token, forgot password, reset password
- `CUSTOMER`: access account after verification

### Customer setup stage

- `ADMIN`: create/update/activate/deactivate customer
- `CUSTOMER`: view own customer details

### Meter setup stage

- `ADMIN`: assign/update/activate/deactivate meter
- `OPERATOR`: view meters
- `CUSTOMER`: view own meters

### Pricing setup stage

- `ADMIN`: create/list/deactivate tariffs, taxes, penalties

### Reading stage

- `ADMIN`: capture and view readings
- `OPERATOR`: capture and view readings

### Billing stage

- `ADMIN`: generate and view bills
- `FINANCE`: generate and view bills
- `CUSTOMER`: view own bills

### Payment stage

- `ADMIN`: record and view payments
- `FINANCE`: record and view payments

### Notification stage

- `ADMIN`: view all notifications
- `CUSTOMER`: view own notifications

## 5. Key business rules to remember

- a customer account must verify email before login works
- customer profile and login account are related but separate
- a meter must belong to a customer before any reading exists
- a reading cannot be duplicated for the same meter and billing month
- a reading must increase over the previous reading
- a bill depends on:
  - active customer
  - existing meter
  - captured reading
  - matching active tariff
- payment cannot exceed remaining bill balance
- notifications are stored even if email sending fails

## 6. Practical usage order for testing

If you are testing the system from Swagger or Postman, the safest order is:

1. Login as admin
2. Create or verify a customer account
3. Create a customer profile if needed
4. Assign a meter
5. Create tariff
6. Create tax configuration
7. Create penalty configuration
8. Capture a meter reading
9. Generate a bill
10. Record a payment
11. Check notifications

If you skip tariff or reading creation, bill generation will fail because the system depends on those earlier steps.

## 7. Why the process is designed this way

This structure matches real utility operations:

- identity is handled separately from billing records
- field work is separated from financial work
- pricing is versioned and date-based
- monthly reading history becomes the basis for billing
- each stage depends on the previous one

That makes the system easier to secure, explain, test, and extend.
