# Road Construction Budgeting System

This project is a graph-based C++ console application for managing Rwanda cities, roads, and road budgets with two adjacency matrices:

- `roadMatrix[i][j]` stores `1` when a road exists, otherwise `0`
- `budgetMatrix[i][j]` stores the road budget, otherwise `0.0`

The graph is undirected, so each road and budget is stored symmetrically in both directions.

## Build

```bash
g++ -std=c++17 -Wall -Wextra -pedantic main.cpp -o road_budget_system
```

## Files

- `cities.txt` stores indexed city names
- `roads.txt` stores unique roads and their budgets

## Mermaid Flowchart

```mermaid
flowchart TD
    A[Start] --> B[Initialize cities list, road matrix, budget matrix]
    B --> C[Display menu]
    C --> D[Read choice]
    D --> E{Choice}
    E -->|1| F[Add cities]
    E -->|2| G[Add road]
    E -->|3| H[Add road budget]
    E -->|4| I[Edit city by index]
    E -->|5| J[Search city by index]
    E -->|6| K[Display cities]
    E -->|7| L[Display road adjacency matrix]
    E -->|8| M[Display cities, road matrix, budget matrix]
    E -->|9| N[Save cities.txt and roads.txt]
    E -->|Other| O[Show invalid choice]
    F --> C
    G --> C
    H --> C
    I --> C
    J --> C
    K --> C
    L --> C
    M --> C
    O --> C
    N --> P[End]
```
