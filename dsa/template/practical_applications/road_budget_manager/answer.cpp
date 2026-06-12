#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

using namespace std;

class RoadBudgetManager {
private:
    vector<string> cities;
    vector<vector<int>> adjacency;
    vector<vector<double>> budgets;

    void resizeMatrices(size_t newSize) {
        for (size_t i = 0; i < adjacency.size(); ++i) {
            adjacency[i].resize(newSize, 0);
            budgets[i].resize(newSize, 0.0);
        }

        while (adjacency.size() < newSize) {
            adjacency.push_back(vector<int>(newSize, 0));
            budgets.push_back(vector<double>(newSize, 0.0));
        }
    }

    bool validIndex(int index) const {
        return index >= 1 && static_cast<size_t>(index) <= cities.size();
    }

public:
    void loadDefaultCities() {
        if (!cities.empty()) {
            return;
        }

        const string defaults[] = {
            "Kigali", "Huye", "Muhanga", "Musanze",
            "Nyagatare", "Rubavu", "Rusizi"
        };

        for (const string &name : defaults) {
            addCity(name);
        }
    }

    void addCity(const string &name) {
        cities.push_back(name);
        resizeMatrices(cities.size());
    }

    void recordExistingRoads() {
        if (cities.size() < 7) {
            return;
        }

        setRoad(1, 3, 28.6);
        setRoad(1, 4, 28.6);
        setRoad(1, 5, 70.84);
        setRoad(3, 2, 56.7);
        setRoad(4, 6, 33.7);
        setRoad(2, 7, 80.96);
        setRoad(3, 7, 117.5);
        setRoad(4, 5, 96.14);
        setRoad(3, 4, 66.3);
    }

    bool setRoad(int firstCity, int secondCity, double budgetValue) {
        if (!validIndex(firstCity) || !validIndex(secondCity) || firstCity == secondCity) {
            return false;
        }

        int from = firstCity - 1;
        int to = secondCity - 1;

        adjacency[from][to] = 1;
        adjacency[to][from] = 1;
        budgets[from][to] = budgetValue;
        budgets[to][from] = budgetValue;
        return true;
    }

    bool modifyCity(int index, const string &newName) {
        if (!validIndex(index)) {
            return false;
        }

        cities[index - 1] = newName;
        return true;
    }

    int searchCity(const string &name) const {
        for (size_t i = 0; i < cities.size(); ++i) {
            if (cities[i] == name) {
                return static_cast<int>(i + 1);
            }
        }

        return -1;
    }

    void displayCities() const {
        cout << "\nCities\n";
        cout << "------\n";
        for (size_t i = 0; i < cities.size(); ++i) {
            cout << setw(2) << (i + 1) << ". " << cities[i] << '\n';
        }
    }

    void displayRoads() const {
        cout << "\nRoads and Budgets\n";
        cout << "-----------------\n";

        int count = 1;
        for (size_t i = 0; i < cities.size(); ++i) {
            for (size_t j = i + 1; j < cities.size(); ++j) {
                if (adjacency[i][j] == 1) {
                    cout << setw(2) << count << ". "
                         << cities[i] << " - " << cities[j]
                         << " : " << fixed << setprecision(2) << budgets[i][j]
                         << " Billion RWF\n";
                    ++count;
                }
            }
        }

        if (count == 1) {
            cout << "No roads recorded.\n";
        }
    }

    bool saveToFile(const string &fileName) const {
        ofstream outFile(fileName.c_str());
        if (!outFile) {
            return false;
        }

        outFile << cities.size() << '\n';
        for (size_t i = 0; i < cities.size(); ++i) {
            outFile << (i + 1) << ',' << cities[i] << '\n';
        }

        outFile << "ADJACENCY\n";
        for (size_t i = 0; i < adjacency.size(); ++i) {
            for (size_t j = 0; j < adjacency[i].size(); ++j) {
                outFile << adjacency[i][j];
                if (j + 1 < adjacency[i].size()) {
                    outFile << ' ';
                }
            }
            outFile << '\n';
        }

        outFile << "BUDGETS\n";
        for (size_t i = 0; i < budgets.size(); ++i) {
            for (size_t j = 0; j < budgets[i].size(); ++j) {
                outFile << fixed << setprecision(2) << budgets[i][j];
                if (j + 1 < budgets[i].size()) {
                    outFile << ' ';
                }
            }
            outFile << '\n';
        }

        return true;
    }
};

int main() {
    RoadBudgetManager manager;
    manager.loadDefaultCities();
    manager.recordExistingRoads();

    int choice = 0;

    do {
        cout << "\nRoad Budget Manager\n";
        cout << "1. Display existing cities\n";
        cout << "2. Add new city\n";
        cout << "3. Register road between cities\n";
        cout << "4. Modify city name\n";
        cout << "5. Search city\n";
        cout << "6. Display roads\n";
        cout << "7. Save data to file\n";
        cout << "8. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;

        if (cin.fail()) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid input.\n";
            continue;
        }

        if (choice == 1) {
            manager.displayCities();
        } else if (choice == 2) {
            string cityName;
            cout << "Enter city name: ";
            cin >> ws;
            getline(cin, cityName);
            manager.addCity(cityName);
            cout << "City added.\n";
        } else if (choice == 3) {
            int firstCity;
            int secondCity;
            double budgetValue;

            manager.displayCities();
            cout << "Enter first city index: ";
            cin >> firstCity;
            cout << "Enter second city index: ";
            cin >> secondCity;
            cout << "Enter budget: ";
            cin >> budgetValue;

            if (manager.setRoad(firstCity, secondCity, budgetValue)) {
                cout << "Road recorded.\n";
            } else {
                cout << "Invalid indexes.\n";
            }
        } else if (choice == 4) {
            int cityIndex;
            string newName;

            manager.displayCities();
            cout << "Enter city index: ";
            cin >> cityIndex;
            cout << "Enter new city name: ";
            cin >> ws;
            getline(cin, newName);

            if (manager.modifyCity(cityIndex, newName)) {
                cout << "City updated.\n";
            } else {
                cout << "Invalid city index.\n";
            }
        } else if (choice == 5) {
            string cityName;
            cout << "Enter city name: ";
            cin >> ws;
            getline(cin, cityName);

            int foundIndex = manager.searchCity(cityName);
            if (foundIndex == -1) {
                cout << "City not found.\n";
            } else {
                cout << cityName << " found at index " << foundIndex << ".\n";
            }
        } else if (choice == 6) {
            manager.displayRoads();
        } else if (choice == 7) {
            if (manager.saveToFile("road_budget_template_data.txt")) {
                cout << "Data saved.\n";
            } else {
                cout << "Failed to save data.\n";
            }
        }
    } while (choice != 8);

    return 0;
}
