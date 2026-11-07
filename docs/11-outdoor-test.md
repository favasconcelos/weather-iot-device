# Outdoor test plan

Do not put the final device outside until the bench test and a 24-hour
indoor run are stable.

## Before going outside

- [ ] Bench test works for 24 hours without a reboot.
- [ ] Battery is charged and fused.
- [ ] The box passes the paper-towel water test.
- [ ] The desiccant is fresh.
- [ ] The sensor is behind the Gore vent, not a plain hole.
- [ ] The LED and magnet status work.
- [ ] The device appears in Home Assistant.
- [ ] You have a reference thermometer/hygrometer to compare against.

## Where to put it

- 1.5-2 m above the ground.
- Over grass or soil, not over concrete or gravel.
- Away from walls, heat vents, air conditioners, and direct sun.
- The shield handles sun, but airflow is better in an open spot.
- Within Thread range of the border router. Start near the house, then move
  it to the final spot.

## Reference measurement

Put a normal thermometer/hygrometer in the same shade, near the device.
Write down both readings at the same time, once a day. This tells you the
temperature offset.

A simple indoor/outdoor thermometer with a remote probe is fine. Do not use
a phone weather app as the reference; it is for a different location.

## 14-day test log

Copy this table into the journey log and fill it in daily.

| Day | Date | Device temp | Reference temp | Device RH | Reference RH | Battery V | Weather | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |
| 4 | | | | | | | | |
| 5 | | | | | | | | |
| 6 | | | | | | | | |
| 7 | | | | | | | | |
| 8 | | | | | | | | |
| 9 | | | | | | | | |
| 10 | | | | | | | | |
| 11 | | | | | | | | |
| 12 | | | | | | | | |
| 13 | | | | | | | | |
| 14 | | | | | | | | |

## Tests

### 1. Sunny day

- Compare the device and reference at midday.
- A difference of more than about 1 °C means the shield or the sensor
  placement needs work.
- Check that the box is not hot to the touch.

### 2. Rain

- After 24 hours of rain, open the box.
- Look for water droplets, damp paper, or condensation.
- If there is water, dry everything, fix the leak, and repeat the paper
  towel test.

### 3. Cold night

- Check the reading near 0 °C.
- Check the battery voltage in the morning.
- Do not charge below 0 °C.

### 4. Radio range

- In Home Assistant, open the Matter network map if available.
- Check the signal strength / RSSI.
- If the device drops offline, move the border router or add a
  mains-powered Thread router.
- A weak signal also costs battery life, because the radio retries.

### 5. Battery

- Log the voltage every day at the same time.
- After 14 days, estimate the monthly drain.
- If the estimate is worse than 6 months, reduce the report frequency or
  improve the signal.

## Success criteria

- [ ] No water inside after rain.
- [ ] Temperature within about ±0.5 °C of the reference on a sunny day.
- [ ] Humidity tracks the reference within a few percent.
- [ ] No dropouts for 14 days.
- [ ] Battery estimate at least 6 months.
- [ ] The box and shield survive wind and sun.

## If something fails

Write it in the journey log with:

- a photo
- the date and weather
- the readings
- what you changed

Then change one thing at a time. Do not change the sensor, the box, and the
firmware in the same day.
