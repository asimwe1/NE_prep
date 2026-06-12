#include <iostream>
#include <limits>
#include <string>

using namespace std;

struct Patient {
    int id;
    string name;
    string dob;
    string gender;
    Patient *next;
};

struct Doctor {
    int id;
    string name;
    string specialization;
    Doctor *next;
};

struct Appointment {
    int id;
    int patientId;
    int doctorId;
    string date;
    Appointment *next;
};

bool patientExists(Patient *head, int id) {
    while (head != NULL) {
        if (head->id == id) {
            return true;
        }
        head = head->next;
    }
    return false;
}

bool doctorExists(Doctor *head, int id) {
    while (head != NULL) {
        if (head->id == id) {
            return true;
        }
        head = head->next;
    }
    return false;
}

bool appointmentExists(Appointment *head, int id) {
    while (head != NULL) {
        if (head->id == id) {
            return true;
        }
        head = head->next;
    }
    return false;
}

void addPatient(Patient **head) {
    Patient *node = new Patient();
    cout << "Enter patient id: ";
    cin >> node->id;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    if (patientExists(*head, node->id)) {
        cout << "Patient id already exists.\n";
        delete node;
        return;
    }

    cout << "Enter patient name: ";
    getline(cin, node->name);
    cout << "Enter patient date of birth: ";
    getline(cin, node->dob);
    cout << "Enter patient gender: ";
    getline(cin, node->gender);

    node->next = *head;
    *head = node;
    cout << "Patient registered successfully.\n";
}

void addDoctor(Doctor **head) {
    Doctor *node = new Doctor();
    cout << "Enter doctor id: ";
    cin >> node->id;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    if (doctorExists(*head, node->id)) {
        cout << "Doctor id already exists.\n";
        delete node;
        return;
    }

    cout << "Enter doctor name: ";
    getline(cin, node->name);
    cout << "Enter specialization: ";
    getline(cin, node->specialization);

    node->next = *head;
    *head = node;
    cout << "Doctor registered successfully.\n";
}

void addAppointment(Appointment **head, Patient *patients, Doctor *doctors) {
    Appointment *node = new Appointment();
    cout << "Enter appointment id: ";
    cin >> node->id;

    if (appointmentExists(*head, node->id)) {
        cout << "Appointment id already exists.\n";
        delete node;
        return;
    }

    cout << "Enter patient id: ";
    cin >> node->patientId;
    cout << "Enter doctor id: ";
    cin >> node->doctorId;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cout << "Enter appointment date: ";
    getline(cin, node->date);

    if (!patientExists(patients, node->patientId)) {
        cout << "Patient not found.\n";
        delete node;
        return;
    }

    if (!doctorExists(doctors, node->doctorId)) {
        cout << "Doctor not found.\n";
        delete node;
        return;
    }

    node->next = *head;
    *head = node;
    cout << "Appointment registered successfully.\n";
}

void displayPatients(Patient *head) {
    cout << "\nPatients\n";
    cout << "--------\n";
    while (head != NULL) {
        cout << "ID: " << head->id
             << ", Name: " << head->name
             << ", DOB: " << head->dob
             << ", Gender: " << head->gender << '\n';
        head = head->next;
    }
}

void displayDoctors(Doctor *head) {
    cout << "\nDoctors\n";
    cout << "-------\n";
    while (head != NULL) {
        cout << "ID: " << head->id
             << ", Name: " << head->name
             << ", Specialization: " << head->specialization << '\n';
        head = head->next;
    }
}

void displayAppointments(Appointment *head) {
    cout << "\nAppointments\n";
    cout << "------------\n";
    while (head != NULL) {
        cout << "ID: " << head->id
             << ", Patient ID: " << head->patientId
             << ", Doctor ID: " << head->doctorId
             << ", Date: " << head->date << '\n';
        head = head->next;
    }
}

int main() {
    Patient *patients = NULL;
    Doctor *doctors = NULL;
    Appointment *appointments = NULL;

    int choice = 0;

    do {
        cout << "\nHospital Management System\n";
        cout << "1. Register patient\n";
        cout << "2. Register doctor\n";
        cout << "3. Register appointment\n";
        cout << "4. Display patients\n";
        cout << "5. Display doctors\n";
        cout << "6. Display appointments\n";
        cout << "7. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;

        if (cin.fail()) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid input.\n";
            continue;
        }

        if (choice == 1) {
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            addPatient(&patients);
        } else if (choice == 2) {
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            addDoctor(&doctors);
        } else if (choice == 3) {
            addAppointment(&appointments, patients, doctors);
        } else if (choice == 4) {
            displayPatients(patients);
        } else if (choice == 5) {
            displayDoctors(doctors);
        } else if (choice == 6) {
            displayAppointments(appointments);
        } else if (choice != 7) {
            cout << "Invalid choice.\n";
        }
    } while (choice != 7);

    return 0;
}
