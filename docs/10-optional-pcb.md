# Optional custom PCB

This is a "version 2" upgrade. Do not do it until version 1 works.

## Why bother?

A custom board:

- replaces the breadboard and jumper wires with a clean board
- makes the sensor placement and battery connection reliable
- can put the SHT40 on the board instead of a breakout
- can copy the Logger HAT idea (the design is open source, MIT licensed, at
  [potblitd/XIAO-log](https://github.com/potblitd/XIAO-log)): sensors powered
  from a GPIO and a switched battery divider
- looks better and fits a smaller box

It is not required for a working device.

## What it would contain

- XIAO ESP32-C6 headers or castellated pads
- SHT40 sensor (bare, with decoupling capacitor)
- Battery connector and 1 A fuse
- Li-ion charger and USB-C charge port
- LED and resistors
- Reed switch connector
- Battery voltage divider
- MOSFET to power the sensor only when measuring
- Optional external antenna connector
- Window-frame mounting holes

## How "printing a board" works

"Printing a board" usually means ordering a **PCB** (printed circuit board)
from a factory. The common hobby services are JLCPCB and PCBWay.

1. We draw the schematic and board in KiCad (free).
2. We export Gerber files.
3. We upload them to JLCPCB.
4. They make 5 boards and ship them. Usually 1-2 weeks.
5. For the tiny SHT40, we can pay a little extra for **PCBA** (they solder
   the sensor and passives for us). Hand-soldering a 1.5 mm sensor is hard.
6. You solder the XIAO, battery wires, LED, and reed switch.

Approximate cost: €15-30 for 5 boards, plus shipping and optional assembly.
Prices vary.

## Design notes

- Follow the XIAO KiCad footprint from Seeed.
- Keep the antenna area clear of copper and metal.
- Keep the SHT40 away from the regulator and the battery.
- Add a 100 nF decoupling capacitor next to the SHT40.
- Add 4.7 kΩ I2C pull-ups if they are not on the sensor module.
- Route the SHT40 power through a MOSFET or a GPIO so it is off between
  measurements.
- Add a fuse and reverse-polarity protection.
- Add test pads for 3V3, GND, SDA, SCL, and battery voltage.
- Use a JST-PH connector for the battery, or solder wires with strain relief.
- Add mounting holes that match the box and the window-frame clamp.

## When to do it

After:

- the bench test works
- the final firmware works
- the battery life is acceptable
- the enclosure design is stable

Then the PCB is a refinement, not a rescue.

## Files

The KiCad project, Gerbers, BOM, and assembly notes will go in
`hardware/` when we reach this stage. There are no PCB files yet.
