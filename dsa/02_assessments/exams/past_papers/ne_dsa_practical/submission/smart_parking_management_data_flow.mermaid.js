const smartParkingManagementDataFlow = String.raw`
flowchart LR
    User[User]
    Menu[Console Menu]
    Slots[(Parking Slots)]
    Active[(Active Vehicles)]
    Tariffs[(Tariffs)]
    History[(Parking History)]
    Billing[Fee Calculation]
    Reports[Reports]

    User --> Menu

    Menu -->|Configure Slot| Slots
    Menu -->|Register Entry| Active
    Menu -->|Register Entry| Slots
    Menu -->|Update Price| Tariffs

    Menu -->|Vehicle Exit| Billing
    Active --> Billing
    Tariffs --> Billing
    Billing --> History
    Billing --> Slots
    Billing --> Active

    Slots --> Reports
    Active --> Reports
    History --> Reports
    Tariffs --> Reports
    Reports --> User
`;

export default smartParkingManagementDataFlow;
