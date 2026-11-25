# Outdoor enclosure

## Goal

Keep the electronics dry, let the sensor breathe, and stop the sun from
making the temperature read too high.

The sun is the biggest problem. A sensor in direct sun can read 5-10 °C too
high. A white louvered shield is not optional.

## Version 1: IP65 box + printed sun shield

```
        +-----------------------------+
        |  white louvered sun shield  |
        |   (5-6 plates, open sides)  |
        |                             |
        |   +---------------------+   |
        |   |  IP65 electronics   |   |
        |   |  box                |   |
        |   |  XIAO + battery     |   |
        |   |  sensor at bottom   |   |
        |   +---------------------+   |
        |                             |
        +-----------------------------+
                 mounting bracket
```

- **Electronics box:** white IP65 ABS/ASA box, about 100 × 68 × 50 mm.
- **Sun shield:** 3D-printed white plates with air gaps, around the box.
- **Sensor:** at the bottom of the box, away from the XIAO and battery.
- **Vent:** Gore vent or PTFE membrane at the bottom, over the sensor.
- **Desiccant:** 1-2 silica gel packs inside.
- **Status LED:** light pipe or clear epoxy window.
- **Magnet switch:** reed switch inside, magnet from outside.
- **Mounting:** pole or fence bracket, 1.5-2 m above ground.

## Why a separate sun shield?

A sealed box in the sun becomes an oven. The shield:

- blocks direct sunlight
- lets air flow around the box
- keeps rain off
- reduces the temperature bias

The shield is a stack of white plates with gaps. The top plate is solid;
the lower plates have a central opening for the box; the sides are open.
This is the same idea as a professional weather station's radiation shield.

## Box size

| Box | Verdict |
|---|---|
| 100 × 68 × 50 mm | Comfortable; fits an 18650 holder and the XIAO |
| 90 × 60 × 35 mm | Compact; possible, but tight |
| 80 × 60 × 40 mm | Works with a flat LiPo pouch, not an 18650 |

The 18650 holder is about 77 × 21 × 15 mm. It sets the minimum length.
Take the holder to the shop if you can.

## Vent and sensor placement

1. Drill a hole at the **bottom** of the box, near where the sensor sits.
2. Install a **Gore vent** or a PTFE membrane. Do not leave a plain hole.
3. Place the SHT40 behind the vent, at the bottom of the box.
4. Keep the XIAO and battery at the top, with an air gap.
5. Do not cover the sensor with foam or tape.

**Open question:** the Logger HAT puts the SHT40 on top of the XIAO, which
conflicts with step 4. The bench test measures how much the XIAO warms it.
If the offset is too large, move the SHT40 to a separate breakout on a short
cable and keep the HAT only for the clock and the battery divider.

A Gore vent lets air pressure equalise and lets water vapour escape, while
keeping liquid water out. This reduces condensation and keeps the humidity
reading honest.

## Desiccant

- Use 1-2 silica gel packs (5-10 g).
- Put them away from the sensor, so they do not dry the air around it.
- Renew them once a year, or when the humidity indicator changes colour.
- Do not use loose silica beads that can rattle into the sensor.

## Status LED

Options, easiest first:

1. **Light pipe:** a small clear acrylic rod from the LED to a hole in the
   box, sealed with an O-ring or silicone.
2. **Clear epoxy window:** fill a small hole with clear epoxy; let it cure.
3. **Translucent printed window:** print a thin white/clear section; less
   reliable but easy.
4. **No visible LED:** use the magnet switch for status and skip the window.
   The device still works; you just cannot see the LED from outside.

The LED is off in normal operation, so it does not attract attention or
waste power.

## Magnet switch

- Solder a normally-open reed switch to a GPIO and GND (with the internal
  pull-up enabled).
- Mount it near the inside of the box wall, at a marked spot.
- Mark the outside with a small dot or a printed icon.
- Use a small neodymium magnet to trigger it.
- Short hold: status. Long hold: factory reset.

This avoids a button hole, which is a common leak point.

## Printing the sun shield

Send the STL file to your friend. They open it in their slicer, choose the
settings, and print.

Suggested settings:

- **Material:** white PETG or ASA. ASA is better for UV and heat; PETG is
  easier to print.
- **Layer height:** 0.2 mm
- **Walls:** 3 perimeters
- **Infill:** 20-30 %
- **Supports:** only if the design needs them
- **Orientation:** flat plates, no bridging if possible

The shield is about 150 × 110 × 120 mm. Check the printer bed size. If the
bed is small, print the plates separately and use threaded spacers.

**STL/STEP files** will be added to `enclosure/` after we measure the exact
box. The design is parametric: plate count, gap, and box size can change.

## Assembly steps

1. **Dry fit.** Put the XIAO, battery holder, and sensor in the box. Check
   that the lid closes without pinching wires.
2. **Mark the holes.** Vent (bottom), LED (front/top), magnet spot (side).
3. **Drill.** Use a step drill for plastic. Deburr the holes.
4. **Install the vent.** Follow the vent's instructions; usually a nut and
   an O-ring.
5. **Install the LED.** Light pipe or clear epoxy. Seal it.
6. **Install the reed switch.** Glue it near the marked spot, inside.
7. **Coat the PCB (optional).** Conformal coating protects against
   condensation. Mask the USB-C port and the sensor opening.
8. **Connect the battery.** Check polarity. Add the fuse.
9. **Add desiccant.** Keep it away from the sensor.
10. **Close the lid.** Check the gasket; tighten the screws evenly, not too
    tight.
11. **Waterproof test.** Put a paper towel inside (no electronics), close
    the box, and leave it in the rain or run it under a gentle shower for
    10 minutes. Open it and check the paper. Repeat until dry.
12. **Mount.** Cable entry down, drip loop, shield over the box, 1.5-2 m
    above ground, away from walls.

## Mounting

- Use a pole or fence bracket. A 3D-printed bracket is fine, but stainless
  screws and a UV-resistant material are better outdoors.
- Keep the XIAO's antenna away from metal. The antenna is at the end of the
  board; orient it toward the outside of the box.
- Do not wrap the box in metal tape or mount it against a metal pole.
- If the Thread signal is weak, move the border router closer, add a
  mains-powered Thread router, or consider an external antenna.

## Maintenance

Once a year:

- Open the box and check for water or condensation.
- Replace the desiccant.
- Inspect the gasket; replace it if it is stiff or cracked.
- Clean dust and leaves from the shield.
- Charge or replace the battery.
- Check the screws and the mounting bracket.

## What can go wrong

| Problem | Cause | Fix |
|---|---|---|
| Water inside | Bad gasket, cable entry, or vent | Dry it, replace the gasket, add silicone, re-test |
| Condensation | Sealed air with moisture | Gore vent, fresh desiccant, conformal coating |
| Temperature too high | Sun, or heat from the XIAO | Better shield, sensor lower, air gap, white box |
| Humidity stuck at 100 % | Water on the sensor | Dry the sensor, check the membrane, add a drip shield |
| LED not visible | No light pipe, or LED off | Use the magnet status, or add a light pipe |
| Weak signal | Metal nearby, distance, interference | Move the border router, add a Thread router, external antenna |
