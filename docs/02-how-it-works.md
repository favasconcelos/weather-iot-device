# How it works, in plain language

## The pieces

```
+-------------------+        Thread radio        +----------------------+       Wi-Fi / Ethernet       +---------------------+
| Window sensor     |  ~~~~~~~~~~~~~~~~~~~~~~~~> | Thread border router |  ~~~~~~~~~~~~~~~~~~~~~~~~> | Raspberry Pi        |
| XIAO + SHT40      |   low power, small data     | ZBT-2 + OTBR         |   normal home network       | HA + Matter Server  |
+-------------------+                             +----------------------+                             +---------------------+
```

- **XIAO ESP32-C6** — the tiny computer. It reads the sensor, talks to the
  network, and goes to sleep.
- **SHT40** — the thermometer and humidity sensor. It talks to the XIAO over
  a simple two-wire connection called I2C.
- **Thread** — a low-power radio network. It is like Wi-Fi for battery devices:
  slower, but it sips power.
- **Thread border router** — a translator. It connects the Thread network to
  your normal Wi-Fi/Ethernet network. Without it, the Pi cannot hear the
  sensor. In this project it is a **ZBT-2 USB radio** plus the **OpenThread
  Border Router (OTBR)** container on the Pi.
- **Matter** — the language Home Assistant uses to talk to the device. It runs
  on top of Thread (or Wi-Fi).
- **Matter Server** — the Home Assistant service that controls Matter devices.
  It is already running on your Pi.

## The data path

1. The XIAO wakes up (or is already in its low-power ICD state).
2. It asks the SHT40 for a temperature and humidity reading.
3. It updates the Matter values.
4. The Thread radio sends a small message to the border router.
5. The border router forwards it to the Matter Server on the Pi.
6. Home Assistant updates the entities.
7. The XIAO goes back to sleep.

The sensor reports every **1-2 hours**. That is not the same as being
unreachable: the Thread radio still checks in with its parent every few
seconds or minutes in low-power mode. That check-in is what costs the
~125 µA, and it lets Home Assistant reach the device when it needs to.

## Why Thread and not Wi-Fi?

Wi-Fi is fast but power-hungry. A Wi-Fi device that stays connected would
empty a battery in days. Thread is designed for battery devices: the radio
is off most of the time, and the device only wakes briefly.

At a 1-2 hour report interval, a Wi-Fi device could look acceptable on a
spreadsheet. The problem is the supported low-power pattern. Matter over
Wi-Fi expects the device to stay associated, and the ESP32-C6 cannot keep a
Wi-Fi connection through deep sleep. Reconnecting the whole Matter stack
every cycle is not a proven design. Thread's ICD mode is the documented,
measured path for a battery Matter sensor.

## Why not a coin cell?

The radio needs short bursts of about 30-50 mA. A coin cell cannot supply
that reliably. Even if it could, its energy is tiny. It would last days,
not months. Use an 18650 or a small LiPo pouch.

## What "sleepy device" means

Matter has a standard for battery devices called **ICD** (Intermittently
Connected Device). In normal words: the device sleeps, wakes on a schedule,
checks in, sends its data, and sleeps again.

For this project:

- Read and report every 1-2 hours.
- Keep the radio in a low-power ICD mode between reports.
- The LED is off unless you ask for status.
- Power-gate the SHT40 breakout (or use a bare SHT40) so its regulator does
  not leak current all day.

This is the difference between a few days and several months of battery life.

## What Home Assistant will show

- Temperature (for example `sensor.window_temperature`)
- Humidity (for example `sensor.window_humidity`)
- Battery percentage
- Battery voltage

The exact names depend on the device name you choose during pairing.

## What runs where

| Piece | Where |
|---|---|
| Home Assistant | Raspberry Pi, Docker container |
| Matter Server | Raspberry Pi, Docker container |
| Thread border router | ZBT-2 USB radio + OTBR container on the Raspberry Pi |
| Sensor firmware | XIAO ESP32-C6 on the office window |
| Sensor | SHT40 on the same small board |

The ZBT-2 is not a standalone border router on its own. The OTBR software on
the Pi is what turns the USB radio into a border router.

## Two phases

1. **Bench test (Wi-Fi):** USB powered, simple Arduino firmware. Proves the
   sensor, the wiring, and the Home Assistant path. No Thread needed yet.
2. **Final device (Thread):** battery powered, low-power ESP-IDF firmware.
   Needs the ZBT-2 and the OTBR container.

Starting with Wi-Fi means you can build and test the sensor while the border
router is on its way.
