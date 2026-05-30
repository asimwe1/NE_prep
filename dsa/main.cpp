#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

using namespace std;

const int MAX_CITIES = 100;

string trim(const string &value) {
    size_t start = value.find_first_not_of(" \t\r\n");
    if (start == string::npos) {
        return "";
    }

    size_t end = value.find_last_not_of(" \t\r\n");
    return value.substr(start, end - start + 1);
}

class RoadNetwork {
  private:
    vector<string> cities;
    vector<vector<int> > roadMatrix;
    vector<vector<double> > budgetMatrix;

    int findCityIndex(const string &cityName) const {
        for (size_t i = 0; i < cities.size(); ++i) {
            if (cities[i] == cityName) {
                return static_cast<int>(i);
            }
        }
        return -1;
    }

    bool isValidDisplayedIndex(int index) const {
        return index >= 1 && index <= static_cast<int>(cities.size());
    }

    void clearInputStream() const {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }

  public:
    RoadNetwork()
        : roadMatrix(MAX_CITIES, vector<int>(MAX_CITIES, 0)),
          budgetMatrix(MAX_CITIES, vector<double>(MAX_CITIES, 0.0)) {}

    void addCities() {
        if (cities.size() >= MAX_CITIES) {
            cout << "Maximum city limit reached.\n";
            return;
        }

        int count;
        cout << "Enter number of cities to add: ";
        if (!(cin >> count)) {
            cout << "Invalid number.\n";
            clearInputStream();
            return;
        }

        clearInputStream();

        if (count <= 0) {
            cout << "Number of cities must be greater than zero.\n";
            return;
        }

        for (int i = 0; i < count && cities.size() < MAX_CITIES; ++i) {
            string cityName;
            cout << "Enter city " << (i + 1) << ": ";
            getline(cin, cityName);
            cityName = trim(cityName);

            if (cityName.empty()) {
                cout << "City name cannot be empty. Try again.\n";
                --i;
                continue;
            }

            if (findCityIndex(cityName) != -1) {
                cout << "City already exists. Enter a different city.\n";
                --i;
                continue;
            }

            cities.push_back(cityName);
            cout << cityName << " added with index " << cities.size() << ".\n";
        }

        if (cities.size() == MAX_CITIES) {
            cout << "City storage is now full.\n";
        }

        saveCitiesToFile();
    }

    void addRoad() {
        if (cities.size() < 2) {
            cout << "At least two cities are required before adding a road.\n";
            return;
        }

        string firstCity;
        string secondCity;

        cout << "Enter first city: ";
        getline(cin >> ws, firstCity);
        firstCity = trim(firstCity);

        cout << "Enter second city: ";
        getline(cin, secondCity);
        secondCity = trim(secondCity);

        int firstIndex = findCityIndex(firstCity);
        int secondIndex = findCityIndex(secondCity);

        if (firstIndex == -1 || secondIndex == -1) {
            cout << "One or both cities do not exist.\n";
            return;
        }

        if (firstIndex == secondIndex) {
            cout << "A road cannot connect a city to itself.\n";
            return;
        }

        if (roadMatrix[firstIndex][secondIndex] == 1) {
            cout << "Road already exists.\n";
            return;
        }

        roadMatrix[firstIndex][secondIndex] = 1;
        roadMatrix[secondIndex][firstIndex] = 1;

        cout << "Road added between " << cities[firstIndex] << " and " << cities[secondIndex] << ".\n";
        saveRoadsToFile();
    }

    void addRoadBudget() {
        if (cities.size() < 2) {
            cout << "At least two cities are required before adding a road budget.\n";
            return;
        }

        string firstCity;
        string secondCity;

        cout << "Enter first city: ";
        getline(cin >> ws, firstCity);
        firstCity = trim(firstCity);

        cout << "Enter second city: ";
        getline(cin, secondCity);
        secondCity = trim(secondCity);

        int firstIndex = findCityIndex(firstCity);
        int secondIndex = findCityIndex(secondCity);

        if (firstIndex == -1 || secondIndex == -1) {
            cout << "One or both cities do not exist.\n";
            return;
        }

        if (roadMatrix[firstIndex][secondIndex] == 0) {
            cout << "Cannot add budget because no road exists between the selected cities.\n";
            return;
        }

        double budget;
        cout << "Enter road budget: ";
        if (!(cin >> budget)) {
            cout << "Invalid budget.\n";
            clearInputStream();
            return;
        }

        clearInputStream();

        if (budget < 0.0) {
            cout << "Budget cannot be negative.\n";
            return;
        }

        budgetMatrix[firstIndex][secondIndex] = budget;
        budgetMatrix[secondIndex][firstIndex] = budget;

        cout << "Budget recorded successfully.\n";
        saveRoadsToFile();
    }

    void editCity() {
        if (cities.empty()) {
            cout << "No cities available to edit.\n";
            return;
        }

        int index;
        cout << "Enter city index to edit: ";
        if (!(cin >> index)) {
            cout << "Invalid index.\n";
            clearInputStream();
            return;
        }

        clearInputStream();

        if (!isValidDisplayedIndex(index)) {
            cout << "Invalid city index.\n";
            return;
        }

        string newName;
        cout << "Enter new city name: ";
        getline(cin, newName);
        newName = trim(newName);

        if (newName.empty()) {
            cout << "City name cannot be empty.\n";
            return;
        }

        int currentIndex = index - 1;
        int duplicateIndex = findCityIndex(newName);
        if (duplicateIndex != -1 && duplicateIndex != currentIndex) {
            cout << "City name already exists.\n";
            return;
        }

        string oldName = cities[currentIndex];
        cities[currentIndex] = newName;
        cout << "City updated from " << oldName << " to " << newName << ".\n";
        saveCitiesToFile();
        saveRoadsToFile();
    }

    void searchCityByIndex() const {
        if (cities.empty()) {
            cout << "No cities available.\n";
            return;
        }

        int index;
        cout << "Enter city index to search: ";
        if (!(cin >> index)) {
            cout << "Invalid index.\n";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            return;
        }

        cin.ignore(numeric_limits<streamsize>::max(), '\n');

        if (!isValidDisplayedIndex(index)) {
            cout << "Invalid city index.\n";
            return;
        }

        cout << "City at index " << index << ": " << cities[index - 1] << "\n";
    }

    void displayCities() const {
        if (cities.empty()) {
            cout << "No cities recorded.\n";
            return;
        }

        cout << "\nRecorded Cities\n";
        for (size_t i = 0; i < cities.size(); ++i) {
            cout << (i + 1) << ". " << cities[i] << "\n";
        }
    }

    void displayRoadMatrix() const {
        if (cities.empty()) {
            cout << "No cities recorded.\n";
            return;
        }

        cout << "\nRoad Adjacency Matrix\n";
        cout << setw(15) << "";
        for (size_t i = 0; i < cities.size(); ++i) {
            cout << setw(15) << cities[i];
        }
        cout << "\n";

        for (size_t i = 0; i < cities.size(); ++i) {
            cout << setw(15) << cities[i];
            for (size_t j = 0; j < cities.size(); ++j) {
                cout << setw(15) << roadMatrix[i][j];
            }
            cout << "\n";
        }
    }

    void displayBudgetMatrix() const {
        if (cities.empty()) {
            cout << "No cities recorded.\n";
            return;
        }

        cout << "\nBudget Adjacency Matrix\n";
        cout << fixed << setprecision(2);
        cout << setw(15) << "";
        for (size_t i = 0; i < cities.size(); ++i) {
            cout << setw(15) << cities[i];
        }
        cout << "\n";

        for (size_t i = 0; i < cities.size(); ++i) {
            cout << setw(15) << cities[i];
            for (size_t j = 0; j < cities.size(); ++j) {
                cout << setw(15) << budgetMatrix[i][j];
            }
            cout << "\n";
        }
    }

    void displayRecordedData() const {
        displayCities();
        displayRoadMatrix();
        displayBudgetMatrix();
    }

    void saveCitiesToFile() const {
        ofstream outFile("cities.txt");
        if (!outFile) {
            cout << "Failed to save cities.txt\n";
            return;
        }

        outFile << left << setw(10) << "Index" << "City_Name\n";
        for (size_t i = 0; i < cities.size(); ++i) {
            outFile << left << setw(10) << (i + 1) << cities[i] << "\n";
        }
    }

    void savedRoadsToFile() const {
        ofstream outFile("roads.txt");
        if (!outFile) {
            cout << "Failed to save roads.txt\n";
            return;
        }

        outFile << left << setw(20) << "City_1"
                << setw (20) << "City_2"
                << "Budget<n";
    }

    void saveRoadsToFile() const {
        ofstream outFile("roads.txt");
        if (!outFile) {
            cout << "Failed to save roads.txt\n";
            return;
        }

        outFile << left << setw(20) << "City_1"
                << setw(20) << "City_2"
                << "Budget\n";

        outFile << fixed << setprecision(2);
        for (size_t i = 0; i < cities.size(); ++i) {
            for (size_t j = i + 1; j < cities.size(); ++j) {
                if (roadMatrix[i][j] == 1) {
                    outFile << left << setw(20) << cities[i]
                            << setw(20) << cities[j]
                            << budgetMatrix[i][j] << "\n";
                }
            }
        }
    }
};

void displayMenu() {
    cout << "\nRoad Construction Budgeting System\n";
    cout << "1. Add cities\n";
    cout << "2. Add road between two cities\n";
    cout << "3. Add road budget\n";
    cout << "4. Edit city name using index\n";
    cout << "5. Search for a city using its index\n";
    cout << "6. Display all cities\n";
    cout << "7. Display road adjacency matrix\n";
    cout << "8. Display all recorded data\n";
    cout << "9. Save and exit\n";
    cout << "Enter your choice: ";
}

int main() {
    RoadNetwork network;
    int choice = 0;

    do {
        displayMenu();

        if (!(cin >> choice)) {
            cout << "Invalid choice.\n";
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            continue;
        }

        cin.ignore(numeric_limits<streamsize>::max(), '\n');

        switch (choice) {
        case 1:
            network.addCities();
            break;
        case 2:
            network.addRoad();
            break;
        case 3:
            network.addRoadBudget();
            break;
        case 4:
            network.editCity();
            break;
        case 5:
            network.searchCityByIndex();
            break;
        case 6:
            network.displayCities();
            break;
        case 7:
            network.displayRoadMatrix();
            break;
        case 8:
            network.displayRecordedData();
            break;
        case 9:
            network.saveCitiesToFile();
            network.saveRoadsToFile();
            cout << "Data saved. Exiting program.\n";
            break;
        default:
            cout << "Invalid choice. Please select from 1 to 9.\n";
            break;
        }
    } while (choice != 9);

    return 0;
}
