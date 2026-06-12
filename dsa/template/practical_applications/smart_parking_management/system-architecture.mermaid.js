const smartParkingManagementFlow = String.raw`
flowchart TD
    Start([Start]) --> Init[Load default tariffs and starter slots]
    Init --> Menu[Display console menu]

    subgraph UI[User Interaction Layer]
        Menu
        Input[Read user choice and input data]
        Output[Display results, reports, and validation messages]
    end

    subgraph Core[Core System Components]
        SlotManager[Slot Manager]
        EntryManager[Vehicle Entry Manager]
        ExitManager[Vehicle Exit and Billing Manager]
        TariffManager[Tariff Manager]
        ReportManager[Report Manager]
        VehicleFactory[Vehicle Factory]
    end

    subgraph Storage[In-Memory Data Structures]
        Slots[(vector ParkingSlot)]
        Active[(unordered_map Active Vehicles)]
        History[(vector Parking History)]
        Tariffs[(unordered_map Tariffs)]
    end

    Menu --> Decision{User choice}

    Decision -->|1 Configure Slot| Input
    Input --> SlotManager
    SlotManager --> S1{Slot ID unique and type valid?}
    S1 -->|No| Output
    S1 -->|Yes| Slots
    Slots --> Output
    Output --> Menu

    Decision -->|2 Register Entry| Input
    Input --> EntryManager
    EntryManager --> E1[Normalize plate and vehicle type]
    E1 --> E2{Vehicle already active?}
    E2 -->|Yes| Output
    E2 -->|No| E3[Find available matching slot]
    E3 --> E4{Matching slot found?}
    E4 -->|No| Output
    E4 -->|Yes| VehicleFactory
    VehicleFactory --> Active
    E4 --> Slots
    Active --> Output
    Slots --> Output
    Output --> Menu

    Decision -->|3 Update Tariff| Input
    Input --> TariffManager
    TariffManager --> T1{Vehicle type valid and price > 0?}
    T1 -->|No| Output
    T1 -->|Yes| Tariffs
    Tariffs --> Output
    Output --> Menu

    Decision -->|4 Vehicle Exit| Input
    Input --> ExitManager
    ExitManager --> X1[Normalize plate and read exit time]
    X1 --> X2{Vehicle exists in active map?}
    X2 -->|No| Output
    X2 -->|Yes| X3[Compute parking duration]
    X3 --> X4[Round partial hours up]
    X4 --> X5[Apply current tariff]
    X5 --> X6[Release occupied slot]
    X6 --> X7[Remove active record]
    X7 --> X8[Store completed transaction in history]
    X8 --> History
    X6 --> Slots
    X7 --> Active
    X5 --> Tariffs
    History --> Output
    Slots --> Output
    Active --> Output
    Output --> Menu

    Decision -->|5 Available Slots| ReportManager
    Decision -->|6 Parked Vehicles| ReportManager
    Decision -->|7 Vehicle History| ReportManager
    Decision -->|8 Daily Revenue| ReportManager
    Decision -->|9 View Tariffs| ReportManager

    ReportManager --> Slots
    ReportManager --> Active
    ReportManager --> History
    ReportManager --> Tariffs
    Slots --> Output
    Active --> Output
    History --> Output
    Tariffs --> Output
    Output --> Menu

    Decision -->|10 Exit| End([End])
`;

export default smartParkingManagementFlow;
