# Window Weather Sensor

A small, battery-powered temperature and humidity sensor for an office window.
It reports to Home Assistant using **Matter over Thread**.

This repository documents the whole journey: parts, wiring, firmware,
3D-printed enclosure, testing, and the mistakes along the way.

## Status

- [x] Decide the architecture
- [x] Check the Home Assistant setup
- [ ] Order the bench kit
- [ ] Order a Thread border router (ZBT-2)
- [ ] Bench test over Wi-Fi
- [ ] Set up the OpenThread Border Router
- [ ] Low-power firmware
- [ ] Window enclosure
- [ ] 1-2 week outdoor test

## The short version

1. A tiny board (Seeed XIAO ESP32-C6) reads a Sensirion SHT40 sensor.
2. It sends temperature and humidity to Home Assistant every 1-2 hours.
3. The final version uses Thread (low power) so it can run on a battery.
4. A Home Assistant Connect ZBT-2, plugged into the Raspberry Pi, acts as the
   Thread border router.
5. A 3D-printed sun shield keeps the sensor out of direct sun and rain.

## Decisions made so far

- **Location:** Zaragoza, Spain. The sensor sits outdoors on the office
  window, with no mains power available.
- **Phone:** Android. This affects how a homemade Matter device is paired.
- **Update interval:** every 1-2 hours. Live data is not needed.
- **Thread border router:** Home Assistant Connect ZBT-2 plus a standalone
  OpenThread Border Router container on the Pi. The ZBT-1 is discontinued;
  a used one still works. A used Nest Hub 2 is the easier fallback.
- **Battery:** protected 18650, recharged about once a year. Target is at
  least 6 months, ideally 12+.
- **Version 1:** off-the-shelf modules, no custom circuit board, no custom case.
- **Bench test:** Wi-Fi, USB powered. **Final:** Thread, battery powered.

## Start here

- [The journey log](docs/00-journey.md)
- [What we are building and why](docs/01-requirements.md)
- [How it works, in plain language](docs/02-how-it-works.md)
- [Shopping list for Spain](docs/03-shopping-list.md)
- [Tools and safety](docs/04-tools-and-safety.md)
- [Bench test, step by step](docs/05-bench-test.md)
- [3D prototype viewer](viewer/README.md)
- [Final low-power firmware](docs/06-final-firmware.md)
- [Home Assistant setup](docs/07-home-assistant.md)
- [Battery and power](docs/08-battery.md)
- [Window enclosure](docs/09-enclosure.md)
- [Optional custom PCB](docs/10-optional-pcb.md)
- [Window test plan](docs/11-outdoor-test.md)
- [Troubleshooting](docs/12-troubleshooting.md)
- [3D prototype notes](docs/13-3d-prototype.md)
- [Thread border router setup](docs/14-thread-border-router.md)

## Glossary

- **Matter** — the language Home Assistant uses to talk to smart devices.
- **Thread** — a low-power radio network. Better than Wi-Fi for battery devices.
- **Thread border router** — a translator between Thread and your normal
  network. In this project: a ZBT-2 USB radio plus the OpenThread Border
  Router container on the Pi.
- **Matter Server** — the Home Assistant service that controls Matter devices.
- **MCU** — the tiny computer on the board.
- **SHT40** — the temperature and humidity sensor.
- **PCB** — a custom circuit board. Not needed for version 1.
- **STL** — the file you give a 3D printer. Like a PDF for printing.
- **STEP** — an editable 3D model file.

## Important

This is a personal DIY project, not a certified commercial product.
Home Assistant will show an "uncertified device" warning. That is normal
for a homemade Matter device and is fine for personal use.
