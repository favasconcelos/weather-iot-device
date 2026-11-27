# Requirements

## Goal

A small sensor outside the office window that measures temperature and
humidity, reports to Home Assistant via Matter every 1-2 hours, and runs for
at least 6 months on one battery charge (ideally 12+).

## Must have

- Temperature and relative humidity measurements.
- Visible in Home Assistant as standard Matter entities.
- Battery level visible in Home Assistant.
- Battery life of at least 6 months, ideally 12.
- Report interval of 1-2 hours. Live data is not required.
- Weatherproof: rain, wind, dust, and Zaragoza sun.
- Works from at least 0 °C to 40 °C; design margin for -10 °C to 50 °C.
- Small enough to mount on the office window frame, outside the glass.
- Status LED with a few clear patterns.
- Reset/re-pair without opening the box (magnet switch).
- Parts easy to buy in Spain/EU.
- Buildable with a normal soldering iron and no specialist tools.

## Nice to have

- 3D-printed sun shield (radiation shield) so the temperature is not biased by
  the sun or the window.
- Custom circuit board for a cleaner final build.
- External antenna option if the signal is weak.
- OTA firmware updates later.

## Not in version 1

- Certified commercial product.
- Custom PCB.
- Custom injection-moulded case.
- Wind, rain, pressure, or air-quality sensors.
- Solar panel. The 1-2 hour interval does not need one.
- Display or local screen.

## Acceptance criteria

The project is "done" when:

- [ ] Home Assistant shows temperature, humidity, and battery percentage.
- [ ] The device updates at least every 2 hours.
- [ ] It runs for at least 6 months on one charge.
- [ ] It survives 2 weeks outdoors on the window in sun and rain.
- [ ] There is no water or condensation inside the electronics box.
- [ ] The temperature reading is within about ±0.5 °C of a shaded reference.
- [ ] The status LED and magnet reset work without opening the box.

## Constraints

- **Phone:** Android. A homemade Matter device may need a Google developer
  console step or a borrowed iPhone/iPad for the first pairing.
- **Home Assistant:** Docker container on a Raspberry Pi, with a separate
  `matter-server` container on a macvlan network. This works for Wi-Fi
  Matter devices today. Thread needs a border router.
- **No Thread border router yet.** This is the main blocker. Preferred:
  Home Assistant Connect ZBT-2 + standalone OTBR container on the Pi; a used
  Google Nest Hub (2nd gen) is the easier fallback. See
  [the border router guide](14-thread-border-router.md).
- **Network:** Thread is IPv6-only. The target is either host networking for
  HA, `matter-server`, and OTBR, or all three on macvlan with IPv6 and router
  advertisements configured. Do not mix the two.
- **No mains power at the window.** The device must run on a battery and be
  brought indoors to charge.
- **Skills:** comfortable with a soldering iron, but not an electronics expert.
- **3D printing:** available through friends, not at home.
- **Budget:** roughly €100-150 for parts, excluding tools. A border router
  adds €40-60.

## Main risks

| Risk | Impact | Mitigation |
|---|---|---|
| No Thread border router | Cannot use the final Thread firmware | Buy a used Google Nest Hub 2, or set up ZBT-2 + OTBR |
| OTBR/IPv6 setup is fiddly in Docker | Cannot commission the Thread sensor | Follow the border router guide; back up; use one network model for HA, matter-server, and OTBR |
| Android refuses homemade Matter device | Cannot commission | Google developer console, or borrow an iPhone/iPad |
| Battery life too short | Fails the 6-month target | Use ICD sleep, 1-2 hour reports, power-gate the sensor, measure and tune |
| Window heats the sensor | Temperature reads too high | Radiation shield, white box, sensor away from glass and wall, compare with a shaded reference |
| Sun heats the sensor | Temperature reads too high | Printed radiation shield, white box, sensor away from electronics |
| Rain/condensation | Electronics corrode | IP65 box, Gore vent, desiccant, conformal coating, drip loop |
| Weak Thread signal | Device drops offline | Move border router, add a mains Thread router, external antenna |
| Self-heating from XIAO/battery | Temperature offset | Keep sensor at the bottom, air gap, compare with reference. The Logger HAT sits on the XIAO, so measure the offset in the bench test and move the sensor off the board if needed |
