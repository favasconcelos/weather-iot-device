# How it works, in plain language

## The pieces

```
+-------------------+        Thread radio        +----------------------+       Wi-Fi / Ethernet       +---------------------+
| Garden sensor     |  ~~~~~~~~~~~~~~~~~~~~~~~~> | Thread border router |  ~~~~~~~~~~~~~~~~~~~~~~~~> | Raspberry Pi        |
| XIAO + Logger HAT |   low power, small data     | Nest Hub 2 / ZBT-1   |   normal home network       | HA + Matter Server  |
+-------------------+                             +----------------------+                             +---------------------+
```

- **XIAO ESP32-C6** — the tiny computer. It reads the sensor, talks to the
  network, and goes to sleep.
- **XIAO Logger HAT** — a small add-on board that sits on the XIAO. It has
  the **SHT40** thermometer and humidity sensor, a light sensor, a real-time
  clock, and a battery voltage divider. The chips talk to the XIAO over a
  simple two-wire connection called I2C.
- **Thread** — a low-power radio network. It is like Wi-Fi for battery devices:
  slower, but it sips power.
- **Thread border router** — a translator. It connects the Thread network to
  your normal Wi-Fi/Ethernet network. Without it, the Pi cannot hear the sensor.
- **Matter** — the language Home Assistant uses to talk to the device. It runs
  on top of Thread (or Wi-Fi).
- **Matter Server** — the Home Assistant service that controls Matter devices.
  It is already running on your Pi.

## The data path

1. The XIAO wakes up.
2. It powers the HAT sensors and asks the SHT40 for a temperature and
   humidity reading.
3. It updates the Matter values.
4. The Thread radio sends a small message to the border router.
5. The border router forwards it to the Matter Server on the Pi.
6. Home Assistant updates the entities.
7. The XIAO goes back to sleep.

## Why Thread and not Wi-Fi?

Wi-Fi is fast but power-hungry. A Wi-Fi device that stays connected would
empty a battery in days. Thread is designed for battery devices: the radio
is off most of the time, and the device only wakes briefly.

## Why not a coin cell?

The radio needs short bursts of about 30-50 mA. A coin cell cannot supply
that reliably. Even if it could, its energy is tiny. It would last days,
not months. Use an 18650 or a small LiPo pouch.

## What "sleepy device" means

Matter has a standard for battery devices called **ICD** (Intermittently
Connected Device). In normal words: the device sleeps, wakes on a schedule,
checks in, sends its data, and sleeps again.

For this project:

- Wake every 5 minutes to read the sensor and update Home Assistant.
- Keep the radio in a low-power mode between check-ins.
- The LED is off unless you ask for status.

This is the difference between a few days and several months of battery life.

## What Home Assistant will show

- Temperature (for example `sensor.garden_temperature`)
- Humidity (for example `sensor.garden_humidity`)
- Battery percentage
- Battery voltage

The exact names depend on the device name you choose during pairing.

## What runs where

| Piece | Where |
|---|---|
| Home Assistant | Raspberry Pi, Docker container |
| Matter Server | Raspberry Pi, Docker container |
| Thread border router | Separate device on the home network (Nest Hub 2 or ZBT-1) |
| Sensor firmware | XIAO ESP32-C6 in the garden |
| Sensor | SHT40 on the Logger HAT, stacked on the XIAO |

## Two phases

1. **Bench test (Wi-Fi):** USB powered, simple Arduino firmware. Proves the
   sensor, the wiring, and the Home Assistant path. No Thread needed yet.
2. **Final device (Thread):** battery powered, low-power ESP-IDF firmware.
   Needs the Thread border router.

Starting with Wi-Fi means you can build and test the sensor while the border
router is on its way.
