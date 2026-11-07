# Shopping list for Spain

Prices are approximate and change often. Check the current price and
shipping before ordering. The goal is "easy to find", not "cheapest
possible".

## How to read this list

- **Phase 1** is everything you need for the bench test. Order this first.
- **Phase 2** is the outdoor build. Order it after the bench test works.
- **ZBT-2 border router** is the one extra device the project needs.
- **Do not buy yet** is listed at the end. It avoids wasting money on
  parts we may not need.

---

## Phase 1 — Bench kit (order now)

| Part | Why | Approx. price | Where to look |
|---|---|---|---|
| Seeed XIAO ESP32-C6 | The tiny computer | €8-12 | [Seeed Studio](https://www.seeedstudio.com/Seeed-Studio-XIAO-ESP32C6-p-5884.html), Amazon.es, Mouser.es, Digi-Key |
| SHT40 breakout | Temperature + humidity sensor | €6-10 | Adafruit [#4885](https://www.adafruit.com/product/4885), Mouser.es, Digi-Key, Amazon.es |
| Breadboard, 400 points | Temporary wiring | €4-6 | Amazon.es, PCComponentes, local electronics shop |
| Jumper wires, male-female | Connect the board to the sensor | €3-5 | Amazon.es, PCComponentes |
| USB-C **data** cable | Power and programming | €5-8 | Amazon.es, PCComponentes |
| Male pin headers | Solder to the XIAO so it fits the breadboard | €2 | Amazon.es, local electronics shop |
| Multimeter (optional but useful) | Check voltage, current, continuity | €15-25 | Amazon.es, Leroy Merlin, PCComponentes |

**Search terms for Amazon.es**

- `Seeed XIAO ESP32C6`
- `Adafruit SHT40` or `SHT40 breakout`
- `protoboard 400 puntos`
- `cables dupont macho hembra`
- `cable USB-C datos`
- `tira de pines macho 2.54mm`
- `multimetro digital`

**Notes**

- The XIAO usually ships without pin headers. You need to solder them.
- The Adafruit SHT40 breakout has a 3.3 V regulator and level shifter.
  That is fine for the bench. For the final battery build it wastes a little
  standby current; we may power it from a GPIO or use a bare sensor later.
- Buy two SHT40 breakouts if the shipping is high. A spare is useful while
  debugging.
- If you buy from Mouser or Digi-Key, combine the XIAO, sensor, headers,
  resistors, and LED in one order to make the shipping worth it.

---

## Phase 2 — Outdoor kit (order after the bench test)

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

**Chosen: Home Assistant Connect ZBT-2 + Docker OTBR.** One radio, one extra
purchase, fully local. The ZBT-1 is discontinued; buy a used one only if it
is cheap and you do not mind the older radio.

| Option | Cost | Effort | Notes |
|---|---|---|---|
| **Home Assistant Connect ZBT-2 + Docker OTBR** | **~€45** | **Medium** | **Chosen.** Better antenna than the ZBT-1. Your HA runs in Docker, so you run a standalone OTBR container. Budget an evening. |
| Used Home Assistant Connect ZBT-1 + Docker OTBR | €20-35 | Medium | Still works and gets updates, but it is out of production. Same OTBR setup. |
| Used Google Nest Hub (2nd gen) | €40-60 | Low | Easiest on the border-router side, but the Thread network is Google-owned and you must sync credentials. Good fallback. |
| New Google Nest Hub (2nd gen) | €70-100 | Low | MediaMarkt, Amazon.es. More expensive than the ZBT-2. |
| Google TV Streamer | €100-120 | Low | Newer, more expensive, also has Thread. |
| Borrow an Apple TV 4K / HomePod mini | €0 | Low | Only if you can borrow one. It creates an Apple Thread network. |

**Why the ZBT-2?** It is the current Nabu Casa radio, it keeps the Thread
network under your control, and it is cheaper than a Nest Hub. The catch is
that it is only a radio: you need the OpenThread Border Router container on
the Pi. See [the border router guide](14-thread-border-router.md).

The ZBT-2 includes a USB-C cable. Use it, and keep the radio away from USB 3
ports and metal. If the Pi is in a cabinet, a short USB extension cable helps.

**If you choose a Nest Hub instead:** set it up in the Google Home app on the
same Wi-Fi network as Home Assistant, then use the Android Companion app to
send the Thread credentials to Home Assistant. See
[Home Assistant Thread docs](https://www.home-assistant.io/integrations/thread/).

---

## Do not buy yet

- Custom PCB (JLCPCB/PCBWay). Only after version 1 works.
- Bare SHT40 sensor. Hard to hand-solder; use the breakout for now. Revisit it
  if the breakout's regulator wastes too much standby current.
- Expensive power profiler (Joulescope, Otii, Nordic PPK2). We can estimate
  with a multimeter first.
- 3D printer. Use your friend's printer.
- Solar panel. The 1-2 hour interval does not need one.
- Fancy enclosure. The IP65 box + printed shield is enough.
- ZBT-1 at a collector price. The ZBT-2 is the current part.

---

## Cost summary

| Phase | Approx. cost |
|---|---|
| Bench kit | €30-50 |
| Outdoor kit | €65-90 |
| ZBT-2 border router | €45 |
| **Total** | **€140-190** |

Tools (soldering iron, multimeter, etc.) are extra if you do not already
own them.

---

## Spain-specific notes

- **Zaragoza shops:** Leroy Merlin, Brico Depôt, and Bricomart are good for
  the IP65 box, cable gland, silicone, screws, and fuse holder. Check stock
  online before driving.
- **Electronics:** Mouser.es and Digi-Key have fast shipping but charge
  shipping unless the order is large. Combine parts. Amazon.es is faster for
  generic modules but quality varies.
- **ZBT-2:** buy from the Nabu Casa store, Seeed Studio, or an EU reseller.
  Avoid marketplace listings with unknown firmware. The ZBT-1 is
  discontinued, so only buy one used if it is cheap.
- **Used devices:** Wallapop and Milanuncios are the best places for a used
  Nest Hub 2 if you choose the fallback. Ask for the original power adapter.
- **18650 cells:** NKON (Netherlands) is reliable and ships to Spain. A local
  vape shop may also have protected cells, but check the brand and condition.
- **Import:** Seeed Studio ships from China. Expect 2-4 weeks and possible
  customs handling. If you want it faster, check Mouser.es or Amazon.es.
- **Summer heat:** Zaragoza can exceed 40 °C. The white box and sun shield
  are not optional. Park the device in shade if possible, but the shield
  must still allow airflow.
- **Winter cold:** Zaragoza can go below 0 °C. The sensor is fine; the
  Li-ion battery discharges below 0 °C but must be charged indoors.
