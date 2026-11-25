# Battery and power

## The short version

Use a **protected 18650 Li-ion cell**. It is easy to find, rechargeable,
and gives the best chance of 6-12 months. A flat LiPo pouch is the smaller
alternative.

Do not use a coin cell. The radio needs short bursts of 30-50 mA, which a
coin cell cannot supply reliably.

## Battery options

| Option | Energy | Size | Pros | Cons |
|---|---|---|---|---|
| Protected 18650 | ~3000-3400 mAh | 18 × 65 mm | Easy, rechargeable, XIAO charges it | Bigger; metal cell near antenna |
| LiPo pouch 2000-3000 mAh | 2000-3000 mAh | ~50 × 60 × 10 mm | Smaller, flat | Solder only; not replaceable; puncture risk |
| 2× AA lithium | ~3000 mAh at 3 V | 2× 14 × 50 mm | Replaceable; good cold performance | Needs a boost converter; more wiring |
| 2× AAA | ~1000 mAh at 3 V | 2× 10 × 44 mm | Small | Short life; needs a boost converter |
| Coin cell | ~200 mAh | 20 mm | Tiny | Cannot supply the radio; not viable |

**Recommendation:** 18650 for version 1. It is the simplest and safest
choice, and the battery is not what makes the box big — the sun shield is.

## How long will it last?

Rough estimate:

```
battery life (hours) = usable capacity (mAh) / average current (mA)
```

Examples with a 3000 mAh usable capacity:

| Average current | Battery life |
|---|---|
| 200 µA | ~17 months |
| 300 µA | ~11 months |
| 400 µA | ~8.5 months |
| 600 µA | ~5.7 months |
| 1 mA | ~3.4 months |

With a 2000 mAh LiPo:

| Average current | Battery life |
|---|---|
| 300 µA | ~7.6 months |
| 400 µA | ~5.7 months |

**Target:** average current below 400 µA for a 3000 mAh cell, or below
300 µA for a 2000 mAh pouch.

## What uses power

| Load | Typical | Notes |
|---|---|---|
| XIAO light sleep + Thread poll | 100-300 µA | The dominant load; depends on the ICD settings |
| SHT40 measurement | ~0.5 mA for ~10 ms every 5 min | Negligible average |
| LED | 0 mA | Off by default |
| Battery divider (1 MΩ + 1 MΩ) | ~1.8 µA | Acceptable; not needed with the Logger HAT |
| Logger HAT (clock only, sensors off) | ~0.25 µA | The clock is always on; the sensors and divider are switched by D10 |
| Regulator / charger quiescent | 5-20 µA | Depends on the board |
| Radio transmit bursts | ~20-30 mA for a few ms | Small average |

The sensor and LED are not the problem. The radio polling and the board's
sleep current are.

## How to measure

### Coarse method (good enough to start)

1. Charge the battery fully.
2. Put the device in its final sleep mode.
3. Connect a multimeter in series with the battery positive, on the µA/mA
   range.
4. Wait for the device to settle into sleep.
5. Write down the sleep current.
6. Watch the display for a few minutes to see the wake spikes.
7. Estimate the average.

A cheap multimeter may have a "burden voltage" that disturbs the device
during transmit spikes. If the device resets when you connect the meter,
measure the sleep current only (during a long sleep), and estimate the
spikes.

### Better method

Use a 10 Ω shunt resistor in series with the battery and measure the voltage
across it with a multimeter or oscilloscope:

```
I = V / 10
```

1 mV across 10 Ω = 100 µA. This has much less burden voltage than the
multimeter's current range.

### Practical method

Run the device on a fully charged battery for 1-2 weeks and log the voltage.
Then extrapolate. This is slower but very believable, and it catches problems
that a bench measurement misses.

### Power profilers

A Nordic Power Profiler Kit II, Joulescope, or Otii Arc is excellent but
expensive. Do not buy one for this project unless you plan to do more
battery devices.

## Charging

- The XIAO has a built-in Li-ion charger. Charge through its USB-C port.
- Charge indoors, at 0-40 °C. Never charge a Li-ion cell below 0 °C.
- The XIAO's red LED indicates charging. It turns off when full.
- If the box is sealed, either open it to charge, or add a waterproof USB-C
  panel connector. Opening it once a year is simpler for version 1.
- Use a protected cell and a 1 A fuse.
- Do not charge unattended the first time.

## Battery voltage measurement

### With the Logger HAT

The Logger HAT has a battery voltage divider that is switched by D10
(GPIO18):

1. Wire the battery positive to the HAT's battery pad. Check Seeed's product
   page for the pad position on your version.
2. Drive D10 HIGH. This also powers the HAT sensors.
3. Read D1/A1 (GPIO1) and multiply the reading by 2.
4. Drive D10 LOW.

Seeed lists battery monitoring on the XIAO ESP32-C6 as supported, with the
extra wiring above. Check the reading against a multimeter before you trust
it.

Do not use D0 (GPIO0) for anything else. The HAT clock's interrupt pin is
connected to it.

### Without the Logger HAT

Wire a voltage divider from the battery positive to A0 (GPIO0):

```
Battery + ---- 1 MΩ ----+---- A0 (GPIO0)
                        |
                       1 MΩ
                        |
Battery - ---------------+---- GND
```

Add a 100 nF capacitor from A0 to GND to steady the reading.

The divider halves the voltage, so:

```
battery voltage = ADC voltage × 2
```

At 4.2 V, A0 sees 2.1 V. The ESP32-C6 ADC can handle that.

**Optional improvement:** use a GPIO to switch the bottom of the divider,
so it draws zero current when not measuring. Not needed for version 1.

## Voltage to percentage

Li-ion voltage is not linear. A simple table is good enough:

| Voltage | Approximate charge |
|---|---|
| 4.20 V | 100 % |
| 4.10 V | 90 % |
| 4.00 V | 80 % |
| 3.90 V | 65 % |
| 3.80 V | 50 % |
| 3.70 V | 30 % |
| 3.60 V | 15 % |
| 3.50 V | 5 % |
| 3.30 V | 0 % |

Measure at rest, not during a radio transmission. The voltage sags under
load.

## Cold weather

- Li-ion discharge at 0 °C is fine, with some capacity loss.
- Charging below 0 °C is not allowed. Bring the device indoors to charge.
- Zaragoza winters can go below 0 °C, so plan for indoor charging.
- If you need better cold performance, use 2× AA lithium cells with a boost
  converter. That is more wiring and a different design.

## Heat

- Li-ion at 40 °C is fine. Avoid leaving it in a hot car.
- The white box and sun shield reduce solar heating.
- Do not fully charge the cell and then leave it in the sun for weeks.
  Charge it to about 80 % before long storage.

## Safety checklist

- [ ] Protected cell from a known brand.
- [ ] 1 A fuse in series with the positive lead.
- [ ] Polarity checked twice.
- [ ] No short between battery + and -.
- [ ] Charge indoors, on a non-flammable surface.
- [ ] Cell not swollen, hot, or damaged.
- [ ] Device not left in direct sun with a full battery.
