# Hospital Management Template

## Scenario Type

This template fits practical exams about:

- hospitals
- clinics
- students and teachers
- customers and staff
- members and services
- appointments or bookings

## Data Structure Focus

- singly linked lists
- validation before insertion
- relationships across records

## Core Entities in this pattern

- primary record 1:
  patient, student, customer, member

- primary record 2:
  doctor, teacher, employee, service provider

- relationship record:
  appointment, booking, allocation, registration

## What this pattern usually tests

- creating nodes with structs
- inserting into linked lists
- checking duplicate IDs
- validating referenced records before creating links
- displaying related data

## How to adapt it

Change these parts when the scenario changes:

- `Patient` -> `Student`, `Customer`, `Member`
- `Doctor` -> `Teacher`, `Staff`, `Specialist`
- `Appointment` -> `Booking`, `Enrollment`, `Assignment`

## Answer file

- `answer.cpp`
