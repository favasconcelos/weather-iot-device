# Journey log

This is the diary of the project. Newest entries first.

---

## 2026-11-07 — Starting the project

### Goal

Build a small outdoor temperature and humidity sensor that reports to
Home Assistant via Matter, runs on a battery for 6-12 months, survives
rain and Zaragoza weather, and shows its status with an LED.

### What we checked

Inspected the existing Home Assistant setup on the Raspberry Pi:

- Home Assistant runs in Docker (`homeassistant` container).
- Matter runs in a separate Docker container (`matter-server`).
- Matter Server has one commissioned device: a eufy robot vacuum (Wi-Fi).
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
| Border router | Used Google Nest Hub (2nd gen) preferred; HA Connect ZBT-1 + Docker is the cheaper but more fiddly alternative |
| Phone | Android; may need a Google Home Developer Console step for a homemade device |
| Battery | Protected 18650 recommended; flat LiPo is the smaller alternative |
| Version 1 | Off-the-shelf modules, wires, IP65 box, 3D-printed sun shield |
| Custom PCB | Later, only if version 1 works |

### Open questions

- Buy a used Nest Hub 2, or try the ZBT-1 + OpenThread Border Router container?
- Will Android pair the homemade Matter device directly, or do we need the
  Google Home Developer Console / a borrowed iPhone?
- Which exact IP65 box size is available in Zaragoza shops?
- What filament does the friend's 3D printer use (white PETG or ASA)?

### Measurements to fill in later

- Sleep current and average current (µA/mA).
- Battery life estimate.
- Temperature offset compared with a reference thermometer.
- Thread/Wi-Fi signal strength at the final garden position.

### Next actions

1. Open the 3D viewer in `viewer/` and click through the four views.
2. Order the bench kit (XIAO ESP32-C6, SHT40 breakout, breadboard, wires, USB-C cable).
3. Buy or borrow a Thread border router.
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
