# Bench firmware

Arduino sketch for the first "it works" test:

- XIAO ESP32-C6
- XIAO Logger HAT (SHT40 temperature and humidity sensor)
- USB power
- Wi-Fi
- Home Assistant via Matter

## Wiring

There are no wires. The Logger HAT is soldered onto the XIAO pins and uses:

| XIAO ESP32-C6 pin | Used for |
|---|---|
| D4 (GPIO22) | I2C SDA |
| D5 (GPIO23) | I2C SCL |
| D10 (GPIO18) | Powers the HAT sensors; the sketch drives it HIGH |
| 3V3, GND | Power |

The HAT also has a light sensor (0x23) and a clock (0x51) on the same I2C
bus, and a battery divider on D1. The bench sketch does not use them yet.

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
Window sensor bench test
SHT40 found.
First reading: 21.34 C, 48.72 %RH
Manual pairing code: 34970112332
QR code URL: https://project-chip.github.io/connectedhomeip/qrcode.html?data=...
Temperature: 21.34 C  Humidity: 48.72 %
```

## If the sensor is not found

Run `../tools/i2c-scan/i2c-scan.ino`. With the Logger HAT fitted it should
list `0x23` (BH1750), `0x44` (SHT40) and `0x51` (PCF8563 clock).

## Pairing

Open the Home Assistant Companion app:

**Settings > Connectivity > Matter > Add device > No, it's new**

Scan the QR code from the URL, or type the manual code.

If Android refuses the device, see the Android section in
[the bench guide](../../docs/05-bench-test.md#6-pair-it-with-home-assistant).

## Notes

- The sketch is a first draft; it will be tested with the real hardware.
  The `D10` power step comes from the Logger HAT documentation and has not
  been confirmed on the bench yet.
- The sensor is read every 5 seconds for the bench. The final firmware will
  report every 1-2 hours to save battery.
- The LED is not used in this sketch.
