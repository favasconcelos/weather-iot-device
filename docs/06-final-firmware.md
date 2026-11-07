# Final low-power firmware

This page is the plan for the final firmware. The actual project will be
added after the bench test works.

## Why not the Arduino sketch?

The Arduino sketch is perfect for the bench, but it keeps the radio and the
main loop running. On a battery it would last days, not months.

The final firmware uses **ESP-IDF** with **Espressif's Matter SDK** and the
**ICD** (Intermittently Connected Device) support. In plain words: the device
sleeps, wakes every few minutes, reads the sensor, reports, and goes back to
sleep.

## Starting points from Espressif

Two official examples are the base:

- [ICD example (`icd_app`)](https://github.com/espressif/esp-matter/tree/main/examples/icd_app)
  — a sleepy Matter device with the power settings we need.
- [Sensors example](https://github.com/espressif/esp-matter/tree/main/examples/sensors)
  — creates a temperature sensor endpoint and a humidity sensor endpoint.

We will combine them: the sensor endpoints from `sensors`, the sleep/power
settings from `icd_app`, and a new SHT40 driver.

## What the final firmware does

1. Boots and joins the Thread network.
2. Reads the SHT40 every 5 minutes.
3. Updates the Matter temperature and humidity attributes.
4. Reads the battery voltage and updates the standard Power Source cluster.
5. Goes back to sleep.
6. Handles the LED patterns and the magnet switch.

## Matter endpoints

| Endpoint | Purpose |
|---|---|
| 0 | Root node, diagnostics, power source |
| 1 | Temperature sensor |
| 2 | Humidity sensor |

Home Assistant shows the battery percentage and voltage because it supports
the standard Matter Power Source cluster (`BatPercentRemaining` and
`BatVoltage`). No custom cluster is needed.

## Files we will create

```
firmware/final/
├── CMakeLists.txt
├── sdkconfig.defaults
├── partitions.csv
└── main/
    ├── app_main.cpp
    ├── sht4x.c
    ├── sht4x.h
    ├── led.c
    ├── led.h
    ├── battery.c
    ├── battery.h
    └── button.c
```

## SHT40 driver

The SHT40 is simple:

- I2C address `0x44`
- High-precision measurement command `0xFD`
- Wait about 10 ms
- Read 6 bytes: temperature MSB, temperature LSB, CRC, humidity MSB,
  humidity LSB, CRC
- Convert:
  - temperature °C = -45 + 175 × raw / 65535
  - humidity % = -6 + 125 × raw / 65535
- Check the CRC (polynomial 0x31, initial value 0xFF)

The Adafruit library is fine for the bench. For the final firmware we will
use a small driver so we control the timing and the power.

## Sleep and power settings

These are the important `sdkconfig` options, based on the `icd_app` example:

```
CONFIG_PM_ENABLE=y
CONFIG_FREERTOS_USE_TICKLESS_IDLE=y
CONFIG_IEEE802154_SLEEP_ENABLE=y
CONFIG_OPENTHREAD_MTD=y
CONFIG_ENABLE_ICD_SERVER=y
CONFIG_ICD_FAST_POLL_INTERVAL_MS=500
CONFIG_ICD_IDLE_MODE_INTERVAL_SEC=300
CONFIG_ICD_ACTIVE_MODE_INTERVAL_MS=1000
CONFIG_ICD_ACTIVE_MODE_THRESHOLD_MS=1000
```

- `IDLE_MODE_INTERVAL_SEC=300` means the device wakes about every 5 minutes.
- The slow polling interval is set by the ICD example. We will measure the
  result and tune it.
- The radio transmits at a reduced power if the link is good. We will test
  this.

## LED patterns

The LED is off in normal operation. These are the patterns:

| Pattern | Meaning |
|---|---|
| 1 green flash | Boot |
| Slow amber pulse | Pairing mode / no Matter fabric |
| 2 quick amber flashes | Joining Thread |
| 3 green flashes | Connected |
| 4 red flashes, 3 repeats | Sensor read error |
| 2 slow red flashes once a day | Battery below 20 % |
| 5 fast green flashes | Identify from Home Assistant |
| Fast red/green alternating | Factory reset |
| Magnet held 1 second | Status on demand: green = OK, red = low battery, amber = no Thread |

A bi-colour red/green LED is enough. It draws zero current when off.

## Magnet switch

A reed switch inside the box, triggered by a magnet from outside:

- Short hold (1 second): show status.
- Long hold (10 seconds): factory reset and re-open pairing.

This avoids drilling a button hole in the waterproof box.

## Battery measurement

- Battery voltage divided by two with two 1 MΩ resistors, into A0 (GPIO0).
- Add a 100 nF capacitor from A0 to GND.
- Measure at rest, not during a radio transmission.
- Convert voltage to percent with a Li-ion curve.
- Report both `BatPercentRemaining` and `BatVoltage`.

The divider draws about 1.8 µA at 3.7 V. That is acceptable.

## Build with Docker

The host machine already has Docker. The official Espressif Matter image
avoids a long manual toolchain install:

```bash
docker pull espressif/esp-matter:latest

docker run --rm -it \
  -v "$PWD/firmware/final:/project" \
  -w /project \
  espressif/esp-matter:latest \
  idf.py set-target esp32c6 build
```

Flashing from the host:

```bash
idf.py -p /dev/ttyACM0 flash monitor
```

If the container cannot see the USB device, pass it explicitly:

```bash
docker run --rm -it --device=/dev/ttyACM0 \
  -v "$PWD/firmware/final:/project" \
  -w /project \
  espressif/esp-matter:latest \
  idf.py -p /dev/ttyACM0 flash monitor
```

## Test plan

- [ ] Builds without warnings.
- [ ] Joins Thread and appears in Home Assistant.
- [ ] Temperature and humidity update every 5 minutes.
- [ ] Battery percentage and voltage appear in Home Assistant.
- [ ] LED patterns work.
- [ ] Magnet status and factory reset work.
- [ ] Sleep current measured.
- [ ] 24-hour run without a reboot.
- [ ] Battery estimate matches the calculation.

## When we build it

We will do this together after the bench test. The first version will be
simple: sensor, battery, sleep. The LED and magnet can be added after the
basic device is stable.
