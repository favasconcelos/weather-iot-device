# Firmware

Two firmware stages:

| Folder | Purpose | Radio | Power |
|---|---|---|---|
| `bench/` | Prove the sensor and Home Assistant path | Wi-Fi | USB |
| `final/` | Real outdoor device | Thread | Battery |

## Bench firmware

Arduino sketch for the XIAO ESP32-C6 and the XIAO Logger HAT (SHT40).
It creates a Matter temperature sensor and a Matter humidity sensor, then
updates them every 5 seconds.

See [the bench guide](../docs/05-bench-test.md) for the full steps.

## Final firmware

ESP-IDF + Espressif Matter SDK, based on the `icd_app` and `sensors`
examples. It is not written yet; the plan is in
[the final firmware doc](../docs/06-final-firmware.md).

## Status

The bench sketch is a first draft. The Logger HAT version compiles with the
ESP32 Arduino core 4.0.0 and the **Huge APP (3MB No OTA/1MB SPIFFS)**
partition scheme, using 88% of the app partition. It has not run on hardware
yet; it will be tested when the parts arrive. If the Arduino Matter
API changes, the sketch may need a small adjustment.
