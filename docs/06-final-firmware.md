# Final low-power firmware

This page is the plan for the final firmware. The actual project will be
added after the bench test works.

The border router setup is in
[the border router guide](14-thread-border-router.md).

## Why not the Arduino sketch?

The Arduino sketch is perfect for the bench, but it keeps the radio and the
main loop running. On a battery it would last days, not months.

The final firmware uses **ESP-IDF** with **Espressif's Matter SDK** and the
**ICD** (Intermittently Connected Device) support. In plain words: the device
stays in a low-power ICD state, wakes on a schedule, reads the sensor,
reports every 1-2 hours, and goes back to sleep.

The radio is not off entirely. It still checks in with its Thread parent
every few seconds or minutes, which is what keeps the device reachable and
costs most of the average current.

## Starting points from Espressif

Two official examples are the base:

- [ICD example (`icd_app`)](https://github.com/espressif/esp-matter/tree/main/examples/icd_app)
  — a sleepy Matter device with the power settings we need.
- [Sensors example](https://github.com/espressif/esp-matter/tree/main/examples/sensors)
  — creates a temperature sensor endpoint and a humidity sensor endpoint.

A useful field report from a similar battery-powered ESP32-C6 sensor is
[`vavallee/homecadia`](https://github.com/vavallee/homecadia). It documents the
current measurements and the traps, even though it uses an e-ink display and
a different enclosure.

We will combine them: the sensor endpoints from `sensors`, the sleep/power
settings from `icd_app`, and a new SHT40 driver.

## What the final firmware does

1. Boots and joins the Thread network.
2. Reads the SHT40 every 1-2 hours.
3. Updates the Matter temperature and humidity attributes.
4. Reads the battery voltage and updates the standard Power Source cluster.
5. Goes back to sleep.
6. Handles the LED patterns and the magnet switch.

## Report interval and reachability

- **Report interval:** every 60-120 minutes.
- **Reachability:** the ICD stays associated in a low-power mode and polls
  its parent between reports. This is separate from the report interval.
- **Why:** Home Assistant does not need live data. The slow report interval
  keeps the radio bursts rare, while the periodic poll keeps the device
  reachable for commands and subscription updates.

Do not confuse the report interval with the ICD idle-mode setting. The
report interval is the application timer; the ICD settings control how the
Thread radio sleeps and polls. Start with the `icd_app` defaults and tune
only after measuring the real current.

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
    ├── sensor_power.c
    ├── sensor_power.h
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

## Sensor power

The Adafruit SHT40 breakout has a 3.3 V regulator and level shifters. They
can draw tens of microamps continuously, which is significant over a year.

For the final build, do one of these:

- Power the breakout from a GPIO (or a small P-channel MOSFET) and turn it on
  only for the measurement, or
- Use a bare SHT40 with 4.7 kΩ I2C pull-ups and a 100 nF decoupling capacitor.

Add a short delay after powering the sensor before reading it, and turn it
off again after the reading. Measure the standby current with the sensor
powered down.

## Sleep and power settings

These are the important `sdkconfig` options, based on the `icd_app` example:

```
CONFIG_PM_ENABLE=y
CONFIG_FREERTOS_USE_TICKLESS_IDLE=y
CONFIG_IEEE802154_SLEEP_ENABLE=y
CONFIG_OPENTHREAD_MTD=y
CONFIG_ENABLE_ICD_SERVER=y
CONFIG_ICD_FAST_POLL_INTERVAL_MS=500
CONFIG_ICD_SLOW_POLL_INTERVAL_MS=5000
CONFIG_ICD_IDLE_MODE_INTERVAL_SEC=60
CONFIG_ICD_ACTIVE_MODE_INTERVAL_MS=1000
CONFIG_ICD_ACTIVE_MODE_THRESHOLD_MS=1000
```

- `IDLE_MODE_INTERVAL_SEC=60` is the Short Idle Time (SIT) ICD setting. The
  1-2 hour report interval is an application timer, not this value.
- Stick to SIT for version 1. Long Idle Time (LIT) needs check-in support in
  the controller, and Home Assistant's support is still limited.
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

The divider draws about 1.8 µA at 3.7 V. That is acceptable. If you want to
remove even that, switch the bottom of the divider with a GPIO and only
enable it during the measurement.

## Expected battery drain

A similar XIAO ESP32-C6 Matter-over-Thread sensor measured about **125 µA**
average with the radio in ICD mode. That is roughly **3 mAh/day**.

With a protected 3400 mAh 18650 (about 3000 mAh usable), that is around
1000 days in theory, or **12-18 months** after cold weather, self-discharge,
and regulator losses. The 1-2 hour report interval is not the dominant load;
the Thread poll is. Measure the real value before trusting the estimate.

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
- [ ] Joins Thread through the ZBT-2 + OTBR and appears in Home Assistant.
- [ ] Temperature and humidity update every 1-2 hours.
- [ ] Battery percentage and voltage appear in Home Assistant.
- [ ] LED patterns work.
- [ ] Magnet status and factory reset work.
- [ ] Sleep current measured.
- [ ] 24-hour run without a reboot.
- [ ] Battery estimate matches the calculation (12+ months target).

## When we build it

We will do this together after the bench test. The first version will be
simple: sensor, battery, sleep. The LED and magnet can be added after the
basic device is stable.
