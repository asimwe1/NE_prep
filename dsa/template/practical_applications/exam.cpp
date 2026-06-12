/**
 * app import libraries
 */
#include <cmath>
#include <cctype>
#include <iomanip>
#include <iostream>
#include <limits>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

/**
 * Global namespace variable std mentioned
 */
using namespace std;

/**
 * Vehicle parent class definition
 */
class Vehicle {
public:
    explicit Vehicle(string plateNumber) : plate(move(plateNumber)) {}
    virtual ~Vehicle() {}
    virtual string type() const = 0;
    const string &plateNumber() const { return plate; }

private:
    string plate;
};

/**
 * motorcycle class as vehicle child
 */
class MotorcycleVehicle : public Vehicle {
public:
    explicit MotorcycleVehicle(const string &plateNumber) : Vehicle(plateNumber) {}
    string type() const { return "Motorcycle"; }
};

/**
 * car class as vehicle child
 */
class CarVehicle : public Vehicle {
public:
    explicit CarVehicle(const string &plateNumber) : Vehicle(plateNumber) {}
    string type() const { return "Car"; }
};

/**
 * truck class as vehicle child
 */
class TruckVehicle : public Vehicle {
public:
    explicit TruckVehicle(const string &plateNumber) : Vehicle(plateNumber) {}
    string type() const { return "Truck"; }
};

struct ParkingSlot {
    int slotId;
    string supportedType;
    string zone;
    bool occupied;
};

struct ActiveParkingRecord {
    unique_ptr<Vehicle> vehicle;
    double entryPrice;
    int slotId;
    int entryMinutes;
};

struct CompletedParkingRecord {
    string plateNumber;
    string vehicleType;
    int slotId;
    int entryMinutes;
    int exitMinutes;
    int chargedHours;
    double feePaid;
};

/**
 * entire managemnt system wrapped in a simple class
 * 
 * why class?
 * allows me to call all the funcitions and class variables anywhere after instance creation
 * and wrapping the system make it clean, polished and robust for maintainance
 */
class SmartParkingManagementSystem {
private:
    vector<ParkingSlot> slots;
    unordered_map<string, ActiveParkingRecord> activeVehicles;
    vector<CompletedParkingRecord> history;
    unordered_map<string, double> tariffs;

    static string trim(const string &text) {
        size_t start = 0;
        while (start < text.size() && isspace(static_cast<unsigned char>(text[start]))) {
            ++start;
        }

        size_t end = text.size();
        while (end > start && isspace(static_cast<unsigned char>(text[end - 1]))) {
            --end;
        }

        return text.substr(start, end - start);
    }

    static string toUpperText(string text) {
        for (size_t i = 0; i < text.size(); ++i) {
            text[i] = static_cast<char>(toupper(static_cast<unsigned char>(text[i])));
        }
        return text;
    }

    static string normalizeVehicleType(const string &vehicleType) {
        string cleaned = toUpperText(trim(vehicleType));
        if (cleaned == "MOTORCYCLE") {
            return "Motorcycle";
        }
        if (cleaned == "CAR") {
            return "Car";
        }
        if (cleaned == "TRUCK") {
            return "Truck";
        }
        return "";
    }

    static string normalizePlateNumber(const string &plateNumber) {
        return toUpperText(trim(plateNumber));
    }

    static int parseTimeToMinutes(const string &timeText) {
        size_t separator = timeText.find(':');
        if (separator == string::npos) {
            return -1;
        }

        int hours = -1;
        int minutes = -1;

        try {
            hours = stoi(timeText.substr(0, separator));
            minutes = stoi(timeText.substr(separator + 1));
        } catch (...) {
            return -1;
        }

        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return -1;
        }

        return hours * 60 + minutes;
    }

    ParkingSlot *findAvailableSlot(const string &vehicleType) {
        for (size_t i = 0; i < slots.size(); ++i) {
            if (!slots[i].occupied && slots[i].supportedType == vehicleType) {
                return &slots[i];
            }
        }
        return NULL;
    }

    ParkingSlot *findSlotById(int slotId) {
        for (size_t i = 0; i < slots.size(); ++i) {
            if (slots[i].slotId == slotId) {
                return &slots[i];
            }
        }
        return NULL;
    }

    bool slotIdExists(int slotId) const {
        for (size_t i = 0; i < slots.size(); ++i) {
            if (slots[i].slotId == slotId) {
                return true;
            }
        }
        return false;
    }

    bool isSupportedVehicleType(const string &vehicleType) const {
        return vehicleType == "Motorcycle" || vehicleType == "Car" || vehicleType == "Truck";
    }

    unique_ptr<Vehicle> createVehicle(const string &plateNumber, const string &vehicleType) const {
        if (vehicleType == "Motorcycle") {
            return unique_ptr<Vehicle>(new MotorcycleVehicle(plateNumber));
        }
        if (vehicleType == "Car") {
            return unique_ptr<Vehicle>(new CarVehicle(plateNumber));
        }
        if (vehicleType == "Truck") {
            return unique_ptr<Vehicle>(new TruckVehicle(plateNumber));
        }
        return unique_ptr<Vehicle>();
    }

    static int calculateChargedHours(int entryMinutes, int exitMinutes) {
        int durationMinutes = exitMinutes - entryMinutes;
        if (durationMinutes <= 0) {
            return 0;
        }
        // Partial hours are billed as full hours.
        return static_cast<int>(ceil(durationMinutes / 60.0));
    }

public:
    SmartParkingManagementSystem() {
        // Default starting tariffs.
        tariffs["Motorcycle"] = 500.0;
        tariffs["Car"] = 1000.0;
        tariffs["Truck"] = 1500.0;
    }

    bool configureSlot(int slotId, const string &supportedType, const string &zone, string &message) {
        string normalizedType = normalizeVehicleType(supportedType);
        string cleanedZone = trim(zone);

        if (slotId <= 0) {
            message = "-> Slot ID must be a positive number.";
            return false;
        }

        if (slotIdExists(slotId)) {
            message = "-> Slot ID already exists.";
            return false;
        }

        if (!isSupportedVehicleType(normalizedType)) {
            message = "-> Use Motorcycle, Car, or Truck only.";
            return false;
        }

        if (cleanedZone.empty()) {
            message = "-> Zone cannot be empty.";
            return false;
        }

        ParkingSlot slot;
        slot.slotId = slotId;
        slot.supportedType = normalizedType;
        slot.zone = cleanedZone;
        slot.occupied = false;
        slots.push_back(slot);
        message = "-> Slot configured successfully.";
        return true;
    }

    // vehical registration
    bool registerVehicleEntry(const string &plateNumber, const string &vehicleType, const string &entryTime, string &message) {
        string normalizedPlate = normalizePlateNumber(plateNumber);
        string normalizedType = normalizeVehicleType(vehicleType);

        // current price at entry is saved in the vehicle records
        const double entryPrice = tariffs.at(normalizedType);

        if (normalizedPlate.empty()) {
            message = "-> Plate number cannot be empty.";
            return false;
        }

        if (!isSupportedVehicleType(normalizedType)) {
            message = "-> Use Motorcycle, Car, or Truck only.";
            return false;
        }

        if (activeVehicles.find(normalizedPlate) != activeVehicles.end()) {
            message = "-> This vehicle is already parked.";
            return false;
        }

        int entryMinutes = parseTimeToMinutes(entryTime);
        if (entryMinutes < 0) {
            message = "-> Enter time like HH:MM, for example 06:12 or 6:12.";
            return false;
        }

        ParkingSlot *slot = findAvailableSlot(normalizedType);
        if (slot == NULL) {
            message = "-> No free slot is available for that vehicle type.";
            return false;
        }

        unique_ptr<Vehicle> vehicle = createVehicle(normalizedPlate, normalizedType);
        if (!vehicle) {
            message = "-> Failed to create vehicle record.";
            return false;
        }

        slot->occupied = true;

        ActiveParkingRecord record;
        record.vehicle = move(vehicle);
        record.entryPrice = entryPrice;
        record.slotId = slot->slotId;
        record.entryMinutes = entryMinutes;
        activeVehicles[normalizedPlate] = move(record);
        message = "-> Vehicle parked successfully.";
        return true;
    }

    // parking price update; since it is general it does not deal with currently packed vehicles only new ones
    bool updateParkingPrice(const string &vehicleType, double newPrice, string &message) {
        string normalizedType = normalizeVehicleType(vehicleType);

        if (!isSupportedVehicleType(normalizedType)) {
            message = "-> Use Motorcycle, Car, or Truck only.";
            return false;
        }

        if (newPrice <= 0) {
            message = "-> Parking price must be greater than zero.";
            return false;
        }

        tariffs[normalizedType] = newPrice;
        message = "-> Price updated successfully.";
        return true;
    }

    bool handleVehicleExit(const string &plateNumber, const string &exitTime, string &message) {
        string normalizedPlate = normalizePlateNumber(plateNumber);
        unordered_map<string, ActiveParkingRecord>::iterator it = activeVehicles.find(normalizedPlate);
        if (it == activeVehicles.end()) {
            message = "-> That plate number is not currently parked.";
            return false;
        }

        int exitMinutes = parseTimeToMinutes(exitTime);
        if (exitMinutes < 0) {
            message = "-> Enter time like HH:MM, for example 08:45.";
            return false;
        }

        if (exitMinutes < it->second.entryMinutes) {
            message = "-> Exit time cannot be earlier than entry time.";
            return false;
        }

        // parking fee calculation on exit consider the entry price not the current price
        int chargedHours = calculateChargedHours(it->second.entryMinutes, exitMinutes);
        double entryRate = it->second.entryPrice;

        // changing price is calculated using the current tariff(explicitly mentioned in the exam) 
        double tarrifRate = tariffs[it->second.vehicle->type()];
        double totalFee = chargedHours * tarrifRate;

        ParkingSlot *slot = findSlotById(it->second.slotId);
        if (slot != NULL) {
            slot->occupied = false;
        }

        // parking record generated
        CompletedParkingRecord record;
        record.plateNumber = normalizedPlate;
        record.vehicleType = it->second.vehicle->type();
        record.slotId = it->second.slotId;
        record.entryMinutes = it->second.entryMinutes;
        record.exitMinutes = exitMinutes;
        record.chargedHours = chargedHours;
        record.feePaid = totalFee;
        history.push_back(record);

        cout << "Parking fee for " << normalizedPlate << " is " << fixed << setprecision(2)
             << totalFee << " RWF for " << chargedHours << " charged hour(s)\n";

        activeVehicles.erase(it);
        message = "-> Vehicle exit recorded successfully.";
        return true;
    }

    // display only available slots skips the occupied ones
    void displayAvailableSlots() const {
        cout << "\nAvailable Slots\n";
        cout << "---------------\n";

        bool found = false;
        for (size_t i = 0; i < slots.size(); ++i) {
            if (!slots[i].occupied) {
                found = true;
                cout << "Slot " << slots[i].slotId
                     << " | Type: " << slots[i].supportedType
                     << " | Zone: " << slots[i].zone << '\n';
            }
        }

        if (!found) {
            cout << "No available slots.\n";
        }
    }

    // all the slots are displayed with their current status (occupied/available)
    void displaySlotStatus() const {
        cout << "\nall Slots status\n";
        cout << "----------------\n";

        bool found = false;
        for (size_t i = 0; i < slots.size(); ++i) {

            //available slot check
            if(!slots[i].occupied) {
                cout << "Slot " << slots[i].slotId 
                     << " | Type: " << slots[i].supportedType
                     << " | Zone: " << slots[i].zone
                     << " | Status: " << "Available" << '\n';
            } /* Occupied slot display */ else {
                cout << "Slot " << slots[i].slotId
                     << " | Type: " << slots[i].supportedType
                     << " | Zone: " << slots[i].zone
                     << " | Status: " << "Occupied" << '\n';
            }
        }
    }

    // currently parked vehicles; the slot it occupies and the rate of charge
    void displayParkedVehicles() const {
        cout << "\nParked Vehicles\n";
        cout << "---------------\n";

        if (activeVehicles.empty()) {
            cout << "No vehicles currently parked.\n";
            return;
        }

        for (unordered_map<string, ActiveParkingRecord>::const_iterator it = activeVehicles.begin();
             it != activeVehicles.end(); ++it) {
            cout << "Plate: " << it->first
                 << " | Type: " << it->second.vehicle->type()
                 << " | Slot: " << it->second.slotId

                 // adding entryprice to help operator know that rate the parked car is to be charged when asked
                 << " | Entry Rate: " << it->second.entryPrice << '\n';
        }
    }


    void displayVehicleHistory() const {
        cout << "\nVehicle History\n";
        cout << "---------------\n";

        if (history.empty()) {
            cout << "No completed parking records.\n";
            return;
        }

        for (size_t i = 0; i < history.size(); ++i) {
            cout << "Plate: " << history[i].plateNumber
                 << " | Type: " << history[i].vehicleType
                 << " | Slot: " << history[i].slotId
                 << " | Hours: " << history[i].chargedHours
                 << " | Fee: " << fixed << setprecision(2) << history[i].feePaid
                 << " RWF\n";
        }
    }

    void displayDailyRevenue() const {
        double total = 0.0;
        for (size_t i = 0; i < history.size(); ++i) {
            total += history[i].feePaid;
        }

        cout << "\nDaily Revenue: " << fixed << setprecision(2) << total << " RWF\n";
    }


    // alphanumeric input validation
    bool isValid(const std::string& s) { 
        for(char c : s){ if(!std::isalnum(static_cast<unsigned char>(c))) return false; } //special character check
        return true && !s.empty(); // Ensure not empty
    }

    // current tariffx display this is independent
    void displayTariffs() const {
        cout << "\nCurrent Tariffs\n";
        cout << "---------------\n";
        cout << "Motorcycle: " << tariffs.at("Motorcycle") << " RWF per hour\n";
        cout << "Car: " << tariffs.at("Car") << " RWF per hour\n";
        cout << "Truck: " << tariffs.at("Truck") << " RWF per hour\n";
    }
};

int main() {
    SmartParkingManagementSystem system;
    string startupMessage;
    system.configureSlot(1, "Motorcycle", "A", startupMessage);
    system.configureSlot(2, "Motorcycle", "A", startupMessage);
    system.configureSlot(3, "Car", "B", startupMessage);
    system.configureSlot(4, "Car", "B", startupMessage);
    system.configureSlot(5, "Truck", "C", startupMessage);

    int choice = 0;

    do {
        cout << "\nSmart Parking Management System\n";
        cout << "1. Configure parking slot\n";
        cout << "2. Register vehicle entry\n";
        cout << "3. Update parking price\n";
        cout << "4. Register vehicle exit and payment\n";
        cout << "5. View available slots\n";
        cout << "6. View parked vehicles\n";
        cout << "7. View vehicle history\n";
        cout << "8. View daily revenue\n";
        cout << "9. View tariffs\n";
        cout << "10. View slot status\n";
        cout << "11. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;

        if (cin.fail()) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "-> Invalid input.\n";
            continue;
        }

        if (choice == 1) {
            int slotId;
            string type;
            string zone;
            string message;
            cout << "Enter slot id: ";
            cin >> slotId;
            cout << "Enter supported type (Motorcycle/Car/Truck): ";
            cin >> type;
            cout << "Enter zone: ";
            cin >> zone;

            system.configureSlot(slotId, type, zone, message);
            cout << message << '\n';
        } else if (choice == 2) {
            string plateNumber;
            string vehicleType;
            string entryTime;
            string message;
            cout << "Enter plate number: ";

            /**
             * since platenumber are globally alphanumeric special character validation is proper way to avoid mistakes
             * 
             * special character validation for platnumber
             */
            while(true) {
                cin >> plateNumber;
                
                if(system.isValid(plateNumber)) break;
                cout << "Invalid plate number: plate number should not include special characters use [0-9 || a-zA-Z] only\n";
                cout << "Enter plate number: ";

            }

            cout << "Enter vehicle type (Motorcycle/Car/Truck): ";
            cin >> vehicleType;
            cout << "Enter entry time (HH:MM): ";
            cin >> entryTime;

            system.registerVehicleEntry(plateNumber, vehicleType, entryTime, message);
            cout << message << '\n';
        } else if (choice == 3) {
            string vehicleType;
            double newPrice;
            string message;
            cout << "Enter vehicle type (Motorcycle/Car/Truck): ";
            cin >> vehicleType;
            cout << "Enter new hourly price: ";
            cin >> newPrice;

            system.updateParkingPrice(vehicleType, newPrice, message);
            cout << message << '\n';
        } else if (choice == 4) {
            string plateNumber;
            string exitTime;
            string message;
            cout << "Enter plate number: ";
            cin >> plateNumber;
            cout << "Enter exit time (HH:MM): ";
            cin >> exitTime;

            system.handleVehicleExit(plateNumber, exitTime, message);
            cout << message << '\n';
        } else if (choice == 5) {
            system.displayAvailableSlots();
        } else if (choice == 6) {
            system.displayParkedVehicles();
        } else if (choice == 7) {
            system.displayVehicleHistory();
        } else if (choice == 8) {
            system.displayDailyRevenue();
        } else if (choice == 9) {
            system.displayTariffs();
        } else if (choice == 10) {
            system.displaySlotStatus();
        } else if (choice != 11) {
            cout << "-> Invalid choice.\n";
        }
    } while (choice != 11);

    return 0;
}
