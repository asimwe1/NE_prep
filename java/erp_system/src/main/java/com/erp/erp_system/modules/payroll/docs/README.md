# Payroll Module

Generates monthly payroll for active employees and prevents duplicates per employee,
month, and year.

Calculation flow:

1. Gross salary = base salary + 14% housing + 14% transport.
2. Deductions = tax + pension + medical insurance + other deduction.
3. Net salary = gross salary - deductions.

The pension rate is read from the database and seeded at 6% for January 2025 onward.
