# Smart Parking Usage Note

## Compile

```powershell
g++ .\smart_parking_management_answer.cpp -std=c++17 -o .\smart_parking_management_answer.exe
```

## Run

```powershell
.\smart_parking_management_answer.exe
```

## Default starting tariffs

- Motorcycle: `500 RWF` per hour
- Car: `1000 RWF` per hour

## Billing rules

- Parking fees are calculated only when the vehicle exits.
- Partial hours are charged as full hours.
- `15 minutes` is billed as `1 hour`.
- `1 hour 20 minutes` is billed as `2 hours`.

## Notes

- Vehicle type input is case-insensitive.
- Plate number matching is case-insensitive.
