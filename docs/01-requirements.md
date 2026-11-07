# Requirements

## Goal

A small outdoor sensor that measures temperature and humidity, reports to
Home Assistant via Matter, and runs for 6-12 months on one battery charge.

## Must have

- Temperature and relative humidity measurements.
- Visible in Home Assistant as standard Matter entities.
- Battery level visible in Home Assistant.
- Battery life of at least 6 months, ideally 12.
- Weatherproof: rain, wind, dust, and Zaragoza sun.
- Works from at least 0 °C to 40 °C; design margin for -10 °C to 50 °C.
- Small enough to mount on a fence or pole.
- Status LED with a few clear patterns.
- Reset/re-pair without opening the box (magnet switch).
- Parts easy to buy in Spain/EU.
- Buildable with a normal soldering iron and no specialist tools.

## Nice to have

- 3D-printed sun shield (radiation shield) so the temperature is not biased by the sun.
- Custom circuit board for a cleaner final build.
- External antenna option if the signal is weak.
- OTA firmware updates later.

## Not in version 1

- Certified commercial product.
- Custom PCB.
- Custom injection-moulded case.
- Wind, rain, pressure, or air-quality sensors.
- Solar panel.
- Display or local screen.

## Acceptance criteria

The project is "done" when:

- [ ] Home Assistant shows temperature, humidity, and battery percentage.
- [ ] The device updates at least every 5 minutes.
- [ ] It runs for at least 6 months on one charge.
- [ ] It survives 2 weeks outdoors in sun and rain.
- [ ] There is no water or condensation inside the electronics box.
- [ ] The temperature reading is within about ±0.5 °C of a shaded reference.
- [ ] The status LED and magnet reset work without opening the box.

## Constraints

- **Phone:** Android. A homemade Matter device may need a Google developer
  console step or a borrowed iPhone/iPad for the first pairing.
- **Home Assistant:** Docker container on a Raspberry Pi, with a separate
  `matter-server` container on a macvlan network. This works for Wi-Fi
  Matter devices today. Thread needs a border router.
- **No Thread border router yet.** This is the main blocker.
- **Skills:** comfortable with a soldering iron, but not an electronics expert.
- **3D printing:** available through friends, not at home.
- **Budget:** roughly €100-150 for parts, excluding tools. A used border
  router adds €40-60.

## Main risks

| Risk | Impact | Mitigation |
|---|---|---|
| No Thread border router | Cannot use the final Thread firmware | Buy a used Google Nest Hub 2, or set up ZBT-1 + OTBR |
| Android refuses homemade Matter device | Cannot commission | Google developer console, or borrow an iPhone/iPad |
| Battery life too short | Fails the 6-month target | Use ICD/sleepy firmware, 5-minute interval, measure and tune |
| Sun heats the sensor | Temperature reads too high | Printed radiation shield, white box, sensor away from electronics |
| Rain/condensation | Electronics corrode | IP65 box, Gore vent, desiccant, conformal coating, drip loop |
| Weak Thread signal | Device drops offline | Move border router, add a mains Thread router, external antenna |
| Self-heating from XIAO/battery | Temperature offset | Keep sensor at the bottom, air gap, compare with reference |
