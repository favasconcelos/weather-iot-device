# Shopping list for Spain

Prices are approximate and change often. Check the current price and
shipping before ordering. The goal is "easy to find", not "cheapest
possible".

## How to read this list

- **Phase 1** is everything you need for the bench test. Order this first.
- **Phase 2** is the window build. Order it after the bench test works.
- **Thread border router** is the one extra device the project needs. It is
  not bought yet.
- **Do not buy yet** is listed at the end. It avoids wasting money on
  parts we may not need.

---

## Phase 1 — Bench kit (ordered)

Ordered from [Seeed Studio](https://www.seeedstudio.com/) on 2026-11-25:

| Part | Seeed SKU | Price | Why |
|---|---|---|---|
| Seeed XIAO ESP32-C6, pre-soldered | 102010636 | €5.99 | The tiny computer; headers already soldered |
| Seeed XIAO Logger HAT | 114993446 | €7.99 | SHT40 temperature + humidity, BH1750 light, PCF8563 clock, battery divider |

Parts total €13.98, plus delivery and any import charges (not recorded
yet; add them here when the parcel arrives).

Still needed for the bench test:

| Part | Why | Approx. price | Where to look |
|---|---|---|---|
| USB-C **data** cable | Power and programming | €5-8 (or use one you own) | Amazon.es, PCComponentes |
| Soldering iron, solder, flux | The HAT is soldered onto the XIAO | You may already own these | See [Tools and safety](04-tools-and-safety.md) |
| Room thermometer (optional) | Compare against the SHT40 | €3-6 | Amazon.es, local shop |
| Multimeter (optional but useful) | Check continuity and voltage | €15-25 | Amazon.es, Leroy Merlin, PCComponentes |
| Breadboard + jumper wires (optional) | Only if you want to wire extra parts later | €7-12 | Amazon.es, PCComponentes |

**Search terms for Amazon.es**

- `cable USB-C datos`
- `termómetro de interior`
- `multimetro digital`
- `protoboard 400 puntos` and `cables dupont macho hembra` (optional)

**Notes**

- The XIAO is the pre-soldered version, so you do not need separate pin
  headers.
- The Logger HAT is not a breakout on wires. It is soldered on the XIAO, so
  the sensor ends up against the board that warms it. Plan to measure the
  offset in the bench test; see [Bench test](05-bench-test.md).
- The HAT runs from the XIAO's 3.3 V pin, so it needs no regulator or level
  shifter. Its sensors are switched from pin D10, so they can be off in deep
  sleep.
- Seeed ships from China, so expect a few weeks and possible customs
  handling; see the notes at the end of this page.
- Alternatives that were checked: a Mouser basket with the same XIAO had a
  €25.00 FedEx delivery charge, and genuine XIAO and Adafruit SHT45 boards on
  Amazon.es cost two to three times as much as Mouser's parts price.

---

## Phase 2 — Window kit (order after the bench test)

| Part | Why | Approx. price | Where to look |
|---|---|---|---|
| Protected 18650 cell | Main battery | €8-12 | NKON (NL), Amazon.es, reputable vape shop |
| 18650 holder | Holds the cell | €2-3 | Amazon.es, local electronics shop |
| Fuse holder + 1 A fuse | Safety in series with the battery | €3-5 | Amazon.es, automotive shop, Leroy Merlin |
| IP65 box, about 100 × 68 × 50 mm | Electronics enclosure | €8-15 | Leroy Merlin, Brico Depôt, Bricomart, Amazon.es |
| Cable gland, M12 or M16 | Only if a cable leaves the box | €2-3 | Leroy Merlin, Brico Depôt, Amazon.es |
| Gore vent or PTFE membrane, M12 | Lets air in, keeps water out | €5-10 | Amazon.es, RS Components, Mouser.es |
| Silica gel desiccant packs | Absorbs moisture inside | €5 | Amazon.es |
| Bi-colour LED (red/green), 3 mm | Status light | €1-2 | Amazon.es, local electronics shop |
| Resistors 220 Ω (2-4 pieces) | LED current limiting | €1 | Local electronics shop, Amazon.es |
| Reed switch, normally open | Magnet-triggered reset/status | €1-2 | Amazon.es, local electronics shop |
| Small neodymium magnet | Trigger the reed switch through the box | €1-2 | Amazon.es, hardware shop |
| Neutral-cure silicone | Seal cable entries and the vent | €5-8 | Leroy Merlin, Brico Depôt, Amazon.es |
| Stainless steel screws, M3 | Close the box | €3-5 | Leroy Merlin, Brico Depôt |
| Heat shrink tube | Insulate solder joints | €3-5 | Amazon.es, local electronics shop |
| JST-PH 2.0 connector (optional) | Disconnect the battery | €2-3 | Amazon.es, local electronics shop |
| White PETG or ASA filament | Sun shield, for your friend's printer | €5-10 | Local 3D printing shop, Amazon.es |

**Search terms for Amazon.es**

- `18650 protegida 3400mAh`
- `portapilas 18650`
- `portafusible 1A`
- `caja estanca IP65 100x68x50`
- `prensaestopas M12`
- `válvula Gore M12` or `membrana PTFE M12`
- `silica gel desecante`
- `LED bicolor rojo verde 3mm`
- `resistencias 220 ohm`
- `reed switch`
- `imán neodimio pequeño`
- `silicona neutra`
- `tornillos inox M3`
- `tubo termorretráctil`
- `conector JST PH 2.0`
- `filamento PETG blanco`

**Notes**

- Buy a **protected** 18650 from a known brand (Samsung, LG, Panasonic,
  Molicel). Avoid unknown brands and cells with exaggerated capacity.
- The fuse is extra safety. A protected cell already has a protection
  circuit, but a fuse is cheap insurance.
- A 100 × 68 × 50 mm box is comfortable. A 90 × 60 × 35 mm box is possible
  but tight with an 18650 holder. Take the holder to the shop if you can.
- White is better than black for the sun. The box should be UV-stabilised
  ABS/ASA, or painted white.
- The Gore vent is important. A plain hole lets water in. A Gore vent
  equalises pressure and keeps liquid water out.

---

## Thread border router

You need exactly one of these options.

| Option | Cost | Effort | Notes |
|---|---|---|---|
| Home Assistant Connect ZBT-2 + standalone OTBR | ~€45 | Medium-high | Preferred path; the full setup is in [the border router guide](14-thread-border-router.md). Not ordered yet. |
| Used Google Nest Hub (2nd gen) | €40-60 | Low | Easiest fallback for Android. Check Wallapop, Milanuncios, Cash Converters, Facebook Marketplace. |
| New Google Nest Hub (2nd gen) | €70-100 | Low | MediaMarkt, Amazon.es. |
| Google TV Streamer | €100-120 | Low | Newer, more expensive, also has Thread. |
| Home Assistant Connect ZBT-1 + Docker OTBR | €30 | Medium-high | Cheaper, but your HA runs in Docker with a custom network. Budget an evening for debugging. |
| Borrow an Apple TV 4K / HomePod mini | €0 | Low | Only if you can borrow one. It creates an Apple Thread network. |

**Important:** the Nest Hub must be set up in the Google Home app on the
same Wi-Fi network as Home Assistant. Then the Home Assistant Companion app
can send the Thread credentials to Home Assistant. See
[Home Assistant Thread docs](https://www.home-assistant.io/integrations/thread/).

**Why a Nest Hub 2 and not a random smart speaker?**
The Nest Hub (2nd gen) is on Home Assistant's list of known-working Thread
border routers. It is common on the used market and easy to set up.

---

## Do not buy yet

- Custom PCB (JLCPCB/PCBWay). Only after version 1 works.
- A separate SHT45 breakout (Adafruit #5665, or #6174 with a PTFE membrane).
  Decide after the bench test: if the Logger HAT reads too warm, a
  separate sensor on a short cable is the fix. It is the same I2C driver
  (`0x44`) and about €12-23 depending on where you buy it.
- Bare SHT40 sensor. Hard to hand-solder; the Logger HAT already has one.
- Expensive power profiler (Joulescope, Otii, Nordic PPK2). We can estimate
  with a multimeter first.
- 3D printer. Use your friend's printer.
- Solar panel. Not needed for the first version.
- Fancy enclosure. The IP65 box + printed shield is enough.

---

## Cost summary

| Phase | Approx. cost |
|---|---|
| Bench kit (ordered) | €13.98 parts plus delivery, and a cable if you need one |
| Window kit | €65-90 |
| Thread border router | €0-60 |
| **Total** | **€79-164** plus delivery and a USB-C cable if needed |

Tools (soldering iron, multimeter, etc.) are extra if you do not already
own them.

---

## Spain-specific notes

- **Zaragoza shops:** Leroy Merlin, Brico Depôt, and Bricomart are good for
  the IP65 box, cable gland, silicone, screws, and fuse holder. Check stock
  online before driving.
- **Electronics:** Mouser.es and Digi-Key have fast shipping but charge
  shipping unless the order is large (Mouser's free-shipping threshold is
  about €75; a small basket was quoted €25.00 for FedEx). Combine parts. Amazon.es
  is faster for generic modules but quality varies, and genuine Seeed and
  Adafruit boards cost two to three times as much.
- **Used devices:** Wallapop and Milanuncios are the best places for a used
  Nest Hub 2. Ask for the original power adapter.
- **18650 cells:** NKON (Netherlands) is reliable and ships to Spain. A local
  vape shop may also have protected cells, but check the brand and condition.
- **Import:** Seeed Studio ships from China. Expect 2-4 weeks and possible
  customs handling. The bench kit was ordered from Seeed directly. Mouser
  ships Seeed parts faster, but with a delivery fee.
- **Summer heat:** Zaragoza can exceed 40 °C. The white box and sun shield
  are not optional. Shade the window if possible, but the shield must still
  allow airflow.
- **Winter cold:** Zaragoza can go below 0 °C. The sensor is fine; the
  Li-ion battery discharges below 0 °C but must be charged indoors.
