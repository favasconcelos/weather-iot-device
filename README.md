# Window Weather Sensor

A small, battery-powered temperature and humidity sensor for an office window.
It reports to Home Assistant using **Matter over Thread** every 1-2 hours.

This repository documents the whole journey: parts, wiring, firmware,
3D-printed enclosure, testing, and the mistakes along the way.

## Status

- [x] Decide the architecture
- [x] Check the Home Assistant setup
- [x] Order the bench kit (XIAO ESP32-C6 + Logger HAT, from Seeed Studio)
- [ ] Order a Thread border router
- [ ] Bench test over Wi-Fi
- [ ] Low-power firmware
- [ ] Window enclosure
- [ ] 1-2 week window test

## The short version

1. A tiny board (Seeed XIAO ESP32-C6) reads a Sensirion SHT40 sensor on the Seeed XIAO Logger HAT.
2. It sends temperature and humidity to Home Assistant every 1-2 hours.
3. The final version uses Thread (low power) so it can run on a battery.
4. A Thread border router (for example a used Nest Hub 2, or a ZBT-2 + OTBR on the Pi) connects it to Home Assistant.
5. A 3D-printed sun shield keeps the sensor out of direct sun and rain.

## Decisions made so far

- **Location:** Zaragoza, Spain. The sensor sits outdoors on the office window, with no mains power available.
- **Phone:** Android. This affects how a homemade Matter device is paired.
- **Update interval:** every 1-2 hours. Live data is not needed.
- **Thread border router:** not owned yet. Preferred: Home Assistant Connect ZBT-2 plus a standalone OpenThread Border Router container on the Pi. A used Google Nest Hub (2nd gen) is the easier fallback.
- **Battery:** protected 18650 recommended for simplicity. A flat LiPo is the smaller alternative.
- **Version 1:** off-the-shelf modules, no custom circuit board, no custom case.
- **Bench sensor:** the Seeed XIAO Logger HAT (SHT40, light sensor, clock, battery divider), soldered on the XIAO. If it reads too warm because of the XIAO underneath, the window build uses a separate sensor on a short cable.
- **Bench test:** Wi-Fi, USB powered. **Final:** Thread, battery powered.

## Start here

- [The journey log](docs/00-journey.md)
- [What we are building and why](docs/01-requirements.md)
- [How it works, in plain language](docs/02-how-it-works.md)
- [Shopping list for Spain](docs/03-shopping-list.md)
- [Tools and safety](docs/04-tools-and-safety.md)
- [Bench test, step by step](docs/05-bench-test.md)
- [3D prototype viewer](https://favasconcelos.github.io/weather-iot-device/) ([source and docs](viewer/README.md))
- [Final low-power firmware](docs/06-final-firmware.md)
- [Home Assistant setup](docs/07-home-assistant.md)
- [Battery and power](docs/08-battery.md)
- [Window enclosure](docs/09-enclosure.md)
- [Optional custom PCB](docs/10-optional-pcb.md)
- [Window test plan](docs/11-outdoor-test.md)
- [Troubleshooting](docs/12-troubleshooting.md)
- [3D prototype notes](docs/13-3d-prototype.md)
- [Thread border router guide (for later)](docs/14-thread-border-router.md)

## Glossary

- **Matter** — the language Home Assistant uses to talk to smart devices.
- **Thread** — a low-power radio network. Better than Wi-Fi for battery devices.
- **Thread border router** — a small translator between Thread and your normal
  network. Here: a ZBT-2 USB radio plus the OpenThread Border Router container
  on the Pi, or a used Nest Hub 2.
- **Matter Server** — the Home Assistant service that controls Matter devices.
- **MCU** — the tiny computer on the board.
- **SHT40** — the temperature and humidity sensor.
- **Logger HAT** — the small add-on board that carries the SHT40, a light sensor, a clock, and a battery divider.
- **PCB** — a custom circuit board. Not needed for version 1.
- **STL** — the file you give a 3D printer. Like a PDF for printing.
- **STEP** — an editable 3D model file.

## Important

This is a personal DIY project, not a certified commercial product.
Home Assistant will show an "uncertified device" warning. That is normal
for a homemade Matter device and is fine for personal use.
