# Bench firmware

Arduino sketch for the first "it works" test:

- XIAO ESP32-C6
- SHT40 breakout
- USB power
- Wi-Fi
- Home Assistant via Matter

## Wiring

| XIAO ESP32-C6 | SHT40 breakout |
|---|---|
| 3V3 | VIN or VCC |
| GND | GND |
| D4 (GPIO22) | SDA |
| D5 (GPIO23) | SCL |

Do not use 5 V for the sensor.

## Upload

1. Install Arduino IDE 2.x.
2. Add the ESP32 boards URL:
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
3. Install **esp32 by Espressif Systems** (3.x or newer).
4. Install **Adafruit SHT4x** and **Adafruit Unified Sensor** from the
   Library Manager.
5. Select **XIAO_ESP32C6**, the correct port, and
   **Partition Scheme > Huge APP (3MB No OTA/1MB SPIFFS)**.
   The Matter library is too large for the default 1.2 MB app partition.
6. Open `bench.ino` and upload.
7. Open the Serial Monitor at 115200 baud.

## Expected output

```
Garden sensor bench test
SHT40 found.
First reading: 21.34 C, 48.72 %RH
Manual pairing code: 34970112332
QR code URL: https://project-chip.github.io/connectedhomeip/qrcode.html?data=...
Temperature: 21.34 C  Humidity: 48.72 %
```

## If the sensor is not found

Run `../tools/i2c-scan/i2c-scan.ino`. The SHT40 should appear at `0x44`.

## Pairing

Open the Home Assistant Companion app:

**Settings > Connectivity > Matter > Add device > No, it's new**

Scan the QR code from the URL, or type the manual code.

If Android refuses the device, see the Android section in
[the bench guide](../../docs/05-bench-test.md#6-pair-it-with-home-assistant).

## Notes

- The sketch is a first draft; it will be tested with the real hardware.
- The sensor is read every 5 seconds for the bench. The final firmware will
  read every 5 minutes to save battery.
- The LED is not used in this sketch.
