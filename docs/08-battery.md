# Battery and power

## The short version

Use a **protected 18650 Li-ion cell**. It is easy to find, rechargeable, and
gives the best chance of 12+ months. A flat LiPo pouch is the smaller
alternative.

The device sits outdoors on the office window with no mains power. The plan
is to bring it indoors and recharge it about once a year.

Do not use a coin cell. The radio needs short bursts of 30-50 mA, which a
coin cell cannot supply reliably.

## Battery options

| Option | Energy | Size | Pros | Cons |
|---|---|---|---|---|
| Protected 18650 | ~3000-3400 mAh | 18 × 65 mm | Easy, rechargeable, XIAO charger works (slowly) | Bigger; metal cell near antenna |
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
| 100 µA | ~41 months |
| 125 µA | ~33 months |
| 150 µA | ~27 months |
| 200 µA | ~21 months |
| 250 µA | ~16 months |
| 300 µA | ~14 months |
| 400 µA | ~10 months |
| 600 µA | ~7 months |
| 1 mA | ~4 months |

With a 2000 mAh LiPo:

| Average current | Battery life |
|---|---|
| 125 µA | ~22 months |
| 200 µA | ~14 months |
| 300 µA | ~9 months |
| 400 µA | ~7 months |
| 600 µA | ~5 months |

**Target:** average current below **250 µA** with a 3000 mAh cell. That gives
about 16 months in theory, which leaves margin for cold weather and ageing.
The 6-month requirement is easy; the 12-month target is realistic.

A similar XIAO ESP32-C6 Matter-over-Thread build measured about **125 µA**
average. Treat that as a reference, not a promise. Measure your own device.

## Why 1-2 hour reports work

The report itself is tiny. The dominant load is the Thread radio checking in
with its parent every few seconds or minutes so the device stays reachable.
That is why the 1-2 hour interval is comfortably within the battery budget:
the radio poll, not the report, sets the average current.

At 125 µA:

```
125 µA = 0.125 mA
0.125 mA × 24 h = 3 mAh/day
3000 mAh / 3 mAh/day = 1000 days (about 33 months)
```

After cold weather, self-discharge, regulator losses, and realistic cell
ageing, plan for **12-18 months**, not 33.

## What uses power

| Load | Typical | Notes |
|---|---|---|
| XIAO light sleep + Thread poll | 100-300 µA | The dominant load; depends on the ICD settings |
| SHT40 measurement | ~0.5 mA for ~10 ms every 1-2 h | Negligible average |
| SHT40 breakout regulator | Tens of µA, continuously | Significant over a year; power-gate it or use a bare sensor |
| LED | 0 mA | Off by default |
| Battery divider (1 MΩ + 1 MΩ) | ~1.8 µA | Acceptable |
| Regulator / charger quiescent | 5-20 µA | Depends on the board |
| Radio transmit bursts | ~20-30 mA for a few ms | Small average |

The sensor and LED are not the problem. The radio polling, the board's sleep
current, and a permanently powered sensor breakout are.

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
that a bench measurement misses. With a 1-2 hour report interval, a 2-week
run is a good sample.

### Power profilers

A Nordic Power Profiler Kit II, Joulescope, or Otii Arc is excellent but
expensive. Do not buy one for this project unless you plan to do more
battery devices.

## Charging

- The XIAO has a built-in Li-ion charger. Charge through its USB-C port.
- The charge current is low. A full 3400 mAh 18650 can take a day or more.
- Charge indoors, at 0-40 °C. Never charge a Li-ion cell below 0 °C.
- The XIAO's red LED indicates charging. It turns off when full.
- If the box is sealed, either open it to charge, or add a waterproof USB-C
  panel connector. Opening it once a year is simpler for version 1.
- Use a protected cell and a 1 A fuse.
- Do not charge unattended the first time.

If you prefer a faster charge, use a proper TP4056-style Li-ion charger
module with a USB-C input, and keep the protection and fuse. Do not connect a
random 5 V supply directly to the cell.

## Battery voltage measurement

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
so it draws zero current when not measuring. Not needed for version 1, but
it is a small win if you are chasing the last few microamps.

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
- At -10 °C, expect noticeably less usable capacity. The 12+ month target
  leaves room for this; the 6-month minimum is still comfortable.
- Charging below 0 °C is not allowed. Bring the device indoors to charge.
- Zaragoza winters can go below 0 °C, so plan for indoor charging.
- If you need better cold performance, use 2× AA lithium cells with a boost
  converter. That is more wiring and a different design.

## Heat

- Li-ion at 40 °C is fine. Avoid leaving it in a hot car.
- The white box and sun shield reduce solar heating.
- Do not fully charge the cell and then leave it in the sun for weeks.
  Charge it to about 80 % before long storage.
- A window can get very hot in direct sun. Shade the box and keep the cell
  away from the glass.

## Safety checklist

- [ ] Protected cell from a known brand.
- [ ] 1 A fuse in series with the positive lead.
- [ ] Polarity checked twice.
- [ ] No short between battery + and -.
- [ ] Charge indoors, on a non-flammable surface.
- [ ] Cell not swollen, hot, or damaged.
- [ ] Device not left in direct sun with a full battery.
