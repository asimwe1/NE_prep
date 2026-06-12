# Smart Parking Management Template

## Scenario Type

This template fits practical exams about:

- public parking
- ticketing and billing
- slot allocation
- vehicle entry and exit
- operational reporting

## Data Structure Focus

- `vector` for parking slot storage
- `unordered_map` for active vehicle lookup by plate number
- `vector` for completed parking history

## What this pattern usually tests

- configuring slots with unique IDs
- checking availability by supported vehicle type
- assigning a free slot to an arriving vehicle
- preventing duplicate active vehicles
- calculating parking duration and fees
- updating active prices without changing old completed records
- releasing resources on exit
- generating reports

## OOP Pattern Used

- `Vehicle` base class
- derived classes for `Motorcycle`, `Car`, and `Truck`
- polymorphic vehicle type handling through a factory method

## How to adapt it

Change these parts when the scenario changes:

- parking slot -> room, counter, desk, bed, booth
- vehicle -> customer, patient, student, package, truck
- parking fee -> service fee, rental charge, booking fee
- zone -> branch, floor, block, section

## Answer file

- `answer.cpp`
