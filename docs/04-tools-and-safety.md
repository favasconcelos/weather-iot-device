# Tools and safety

## Tools you need

### For the bench test

- Soldering iron with a fine tip
- Lead-free solder (0.6-0.8 mm) and flux
- Brass sponge or wet sponge
- Small wire cutters and wire strippers
- Tweezers
- Multimeter
- USB-C data cable
- Breadboard and jumper wires (optional; the Logger HAT needs no wiring)
- Helping hands or a small clamp

### For the window build

- Drill with 3-12 mm bits (for the vent, LED, and cable gland)
- Step drill bit is easier for plastic
- Small screwdriver set
- Heat gun or lighter for heat shrink
- Neutral-cure silicone
- Isopropyl alcohol and a lint-free cloth
- Conformal coating (optional but recommended)
- Small clamps or tape for gluing
- Paper towel for the waterproof test

### Nice to have

- USB power meter with mAh logging (coarse battery estimate)
- Logic analyser (only if I2C debugging gets difficult)
- Bench power supply (not necessary)

---

## Safety: lithium batteries

A protected 18650 is safe when treated well. It can also cause a fire if
abused. Follow these rules.

- Buy a **protected** cell from a known brand. Avoid unknown brands.
- Add a **1 A fuse** in series with the battery positive.
- Check polarity twice before soldering. Red is positive, black is negative.
- Do not puncture, crush, bend, or drop the cell.
- Do not charge below 0 °C. Bring the device indoors to charge in winter.
- Charge on a non-flammable surface, and stay nearby the first time.
- Use the XIAO's built-in charger, or a proper Li-ion charger module. Do not
  connect a random 5 V supply directly to the battery. The XIAO's charge
  current is low; a full 18650 charge can take a day or more.
- If the cell swells, gets hot, or smells sweet, stop using it and dispose
  of it at a battery recycling point.
- Do not leave the device in a hot car or in direct sun with the battery
  fully charged.

## Safety: soldering

- Work in a ventilated area.
- Use lead-free solder and wash your hands after handling it.
- Wear eye protection when clipping wires.
- Do not touch the hot tip. Unplug the iron when you are done.
- Keep the iron away from the battery and the USB cable.
- Tin the pads first, then solder the wire. Do not hold the iron on the
  board for more than a few seconds.

## Safety: the XIAO board

- The XIAO's 3V3 pin is an **output**. Do not feed 5 V into it.
- Do not connect USB power and a battery in a way that back-feeds the
  charger. The XIAO is designed for USB + battery, but check the wiring.
- Do not short 3V3 to GND. Check with a multimeter before powering up.
- Touch a grounded metal object before handling the board (basic ESD care).
- The XIAO's pins are 3.3 V logic. The Logger HAT runs from 2.4 to 3.6 V, so
  never connect 5 V to it.
- The Logger HAT is soldered on top of the XIAO. Tack two opposite corners
  first, and check for bridges between pins before powering up.

## Safety: waterproofing

- Do not trust a single layer of silicone.
- Test the empty box with a paper towel inside before putting electronics in.
- Put the cable entry at the bottom, with a drip loop.
- Use a Gore vent, not a plain hole.
- Add desiccant and renew it once a year.
- If you see condensation, dry the box, replace the desiccant, and check
  the gasket before powering up.

## Safety: Home Assistant

- Do not factory reset the eufy robot vacuum or other working devices.
- Only reset the new sensor.
- Back up the Matter Server data before adding a new device or changing the
  Docker network.
- Do not change the Docker network while the Matter devices are working.
- The eufy robot vacuum is a Wi-Fi Matter device. It can keep working while
  you add Thread, but verify it after the network change.

## Safety: Thread border router

The border router is not bought yet. This applies when you set up the ZBT-2.

- The ZBT-2 runs one protocol at a time. Flash it to Thread firmware; do not
  expect Zigbee and Thread at the same time.
- Only one container should claim the USB radio. Stop any other container
  that has `/dev/ttyACM*` or `/dev/ttyUSB*` mapped.
- Pass the radio by its `/dev/serial/by-id/...` path, not by a number that can
  change after a reboot.
- Use the included USB-C cable. Keep the radio away from USB 3 ports, metal
  cases, and power supplies.
- Thread is IPv6-only. Enable IPv6 forwarding and router-advertisement route
  information on the Pi before debugging the sensor.
- Do not expose the OTBR web UI or REST API to the internet. They are for the
  local network only.
- Back up the `matter-server` data and the OTBR data before changing the
  network or re-flashing the radio.

## Before you power up: checklist

- [ ] Battery polarity checked with a multimeter.
- [ ] No short between 3V3 and GND.
- [ ] Sensor wired to 3V3, GND, SDA, SCL (not 5 V).
- [ ] USB cable is a data cable, not charge-only.
- [ ] The board is on a non-conductive surface.
- [ ] The battery is protected and fused.
- [ ] The box is open and you can see the LED.
