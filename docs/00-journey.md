# Journey log

This is the diary of the project. Newest entries first.

---

## 2026-11-07 — Design update: window, 1-2 hour reports, ZBT-2

### What changed

- The device sits outdoors on the **office window**, not in a garden. There is
  no mains power at that spot.
- Live data is not needed. One report every **1-2 hours** is enough.
- The existing Matter device is an **Anker Solix** power station (model
  `2BAVS-AB6031X-44PE`). It is a **Wi-Fi** Matter device, so Home Assistant
  has no Thread integration or Thread devices yet. That is expected.
- We will buy a **Home Assistant Connect ZBT-2** and run a standalone
  OpenThread Border Router (OTBR) container on the Pi. The ZBT-1 is
  discontinued; a used one still works.

### Why Thread is still the right choice

At a 1-2 hour interval, Wi-Fi might fit the energy budget on paper. The
problem is not the average current; it is the supported low-power pattern.
Matter over Wi-Fi expects the device to stay associated, and the ESP32-C6
cannot keep a Wi-Fi connection through deep sleep. Reconnecting the whole
Matter stack every cycle is not a proven design. Thread's ICD mode is the
documented, measured path for a battery Matter sensor.

A similar XIAO ESP32-C6 + Matter/Thread build measured about **125 µA**
average. That is roughly **3 mAh/day**. A 3000 mAh usable 18650 therefore
lasts about 1000 days in theory, or **12-18 months** after cold weather,
self-discharge, and regulator losses. Six months is easy.

### Decisions

| Topic | Decision |
|---|---|
| Location | Office window, outdoors, no mains power |
| Final radio | Matter over Thread |
| First test | Matter over Wi-Fi, USB powered, to validate the sensor and HA |
| Border router | Home Assistant Connect ZBT-2 + standalone OTBR Docker container |
| Border router fallback | Used Google Nest Hub (2nd gen), or a used ZBT-1 |
| Report interval | Every 1-2 hours; start at 1 hour and tune |
| Battery | Protected 18650, 3400 mAh; recharge about once a year |
| Battery target | At least 6 months, ideally 12+ |
| Network target | Keep HA, matter-server, and OTBR on one network model: all host networking, or all macvlan. Do not mix them. |
| Phone | Android; may need a Google Home Developer Console step for a homemade device |
| Version 1 | Off-the-shelf modules, wires, IP65 box, 3D-printed sun shield |
| Custom PCB | Later, only if version 1 works |

### The network gotcha

The current `matter-server` runs on a macvlan network. The most documented
Thread setup uses host networking for Home Assistant, `matter-server`, and
OTBR. Moving only `matter-server` to host networking can break Home
Assistant's connection to it, because a macvlan container cannot reach its
own Docker host.

Two coherent options are documented in
[the border router guide](14-thread-border-router.md):

1. **Recommended:** move Home Assistant, `matter-server`, and OTBR to host
   networking. The HA URL changes to the Pi's LAN IP.
2. **Keep the current IPs:** keep everything on macvlan, add OTBR on the same
   macvlan network with its own IP, enable IPv6, and avoid the Docker ULA
   source-address problem. This is more advanced.

### Open questions

- Which window-frame clamp or bracket fits the office window?
- Do we move the whole Docker stack to host networking, or keep macvlan?
- Will Android pair the homemade Matter device directly, or do we need the
  Google Home Developer Console / a borrowed iPhone?
- Which exact IP65 box size is available in Zaragoza shops?
- What filament does the friend's 3D printer use (white PETG or ASA)?

### Measurements to fill in later

- Sleep current and average current (µA/mA).
- Battery life estimate from a real 1-2 week run.
- Temperature offset compared with a shaded reference near the window.
- Thread signal strength at the final window position.

### Next actions

1. Order the bench kit (XIAO ESP32-C6, SHT40 breakout, breadboard, wires,
   USB-C cable) and the ZBT-2.
2. Build the bench test over Wi-Fi and commission the sensor into Home
   Assistant.
3. Back up `matter-server`, then decide on the host-network vs macvlan
   topology.
4. Set up the ZBT-2 and OTBR container.
5. Build the low-power firmware and measure the real battery drain.

---

## 2026-11-07 — Starting the project

### Goal

Build a small outdoor temperature and humidity sensor that reports to
Home Assistant via Matter, runs on a battery for at least 6 months (ideally
12+), survives rain and Zaragoza weather, and shows its status with an LED.

### What we checked

Inspected the existing Home Assistant setup on the Raspberry Pi:

- Home Assistant runs in Docker (`homeassistant` container).
- Matter runs in a separate Docker container (`matter-server`).
- Matter Server has one commissioned device: an Anker Solix power station
  (Wi-Fi).
- No USB Thread radio is connected (`/dev/ttyACM*` is absent).
- No OpenThread Border Router container is running.
- The Pi's IPv6 routing table has no Thread route.

### What this means

The Matter Server works for Wi-Fi devices, but it cannot talk to a Thread
device yet. We need a **Thread border router**.

### What we built

- An interactive Three.js viewer in `viewer/` with four views: Assembled,
  Exploded, Wiring, and Print parts.
- The viewer models the XIAO, SHT40, 18650, box, lid, shield, LED, reed
  switch, magnet, and colour-coded wires.
- It includes clickable parts, a connection highlighter, an assembly order,
  and a fanned-out view of the printed shield.

### Decisions

| Topic | Decision |
|---|---|
| Final radio | Matter over Thread (low power) |
| First test | Matter over Wi-Fi, USB powered, to validate the sensor and HA |
| Border router | Superseded: ZBT-2 + Docker OTBR is now the plan. The Nest Hub 2 is the fallback. |
| Phone | Android; may need a Google Home Developer Console step for a homemade device |
| Battery | Protected 18650 recommended; flat LiPo is the smaller alternative |
| Version 1 | Off-the-shelf modules, wires, IP65 box, 3D-printed sun shield |
| Custom PCB | Later, only if version 1 works |

### Open questions

- Will Android pair the homemade Matter device directly, or do we need the
  Google Home Developer Console / a borrowed iPhone?
- Which exact IP65 box size is available in Zaragoza shops?
- What filament does the friend's 3D printer use (white PETG or ASA)?

### Measurements to fill in later

- Sleep current and average current (µA/mA).
- Battery life estimate.
- Temperature offset compared with a reference thermometer.
- Thread/Wi-Fi signal strength at the final window position.

### Next actions

1. Open the 3D viewer in `viewer/` and click through the four views.
2. Order the bench kit (XIAO ESP32-C6, SHT40 breakout, breadboard, wires, USB-C cable).
3. Buy the ZBT-2.
4. Build the bench test and commission the sensor into Home Assistant.
5. Order the outdoor kit after the bench test works.

---

## Log template

```
## YYYY-MM-DD — Short title

### What I did

### What worked

### What failed

### Measurements

### Next
```
