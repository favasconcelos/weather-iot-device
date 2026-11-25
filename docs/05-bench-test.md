# Bench test, step by step

**Goal:** see real temperature and humidity from the SHT40 on the Logger HAT
in Home Assistant, using the XIAO ESP32-C6 over Wi-Fi and USB power.

This is the first "it works" milestone. No battery, no Thread, no box yet.

---

## 1. What you need

- Seeed XIAO ESP32-C6 with pre-soldered headers (Mouser 713-102010636)
- Seeed XIAO Logger HAT (Mouser 713-114993446)
- Soldering iron, solder and flux (the HAT is soldered onto the XIAO)
- USB-C data cable
- A room thermometer to compare against (optional, but useful)
- Arduino IDE on your computer
- Home Assistant Companion app on your Android phone
- Your 2.4 GHz Wi-Fi name and password

---

## 2. Attach the Logger HAT

The Logger HAT is a thumb-sized board with the same outline as the XIAO. It
sits on top of the XIAO, so there is nothing to wire. On the HAT:

| Chip | What it does | I2C address |
|---|---|---|
| SHT40 | Temperature and humidity (the sensor we use) | `0x44` |
| BH1750 | Ambient light | `0x23` |
| PCF8563 | Real-time clock | `0x51` |

It also has I2C pull-up resistors and a battery voltage divider.

The pins it uses on the XIAO ESP32-C6:

| XIAO ESP32-C6 pin | Used for |
|---|---|
| 3V3, GND | Power (the HAT works from 2.4 to 3.6 V; never 5 V) |
| D4 (GPIO22) | SDA |
| D5 (GPIO23) | SCL |
| D10 (GPIO18) | Switches the power of the sensors and the battery divider |
| D1 (GPIO1) | Battery voltage (not used in the bench test) |
| D0 (GPIO0) | Clock alarm interrupt (not used in the bench test) |

```
+-------------------------+
|  XIAO Logger HAT        |   SHT40 + BH1750 + PCF8563
|  (on top)               |
+-------------------------+
|  XIAO ESP32-C6          |   USB-C to the computer
|  (pre-soldered headers) |
+-------------------------+
```

**Assemble it:**

1. Look at the XIAO headers. Make sure no two pins are bridged with solder.
2. Place the HAT on the XIAO so each pad sits over the matching XIAO pin
   (3V3 over 3V3, D4 over D4, and so on).
3. Tack two opposite corners and check the alignment before soldering the
   rest. The pads are small; use a fine tip and little solder.
4. Check the joints for bridges between neighbouring pins.

Seeed's product page has pictures of the assembled stack:
[XIAO Logger HAT](https://www.seeedstudio.com/XIAO-LOG-p-6341.html).

**Before powering up:**

- Do not connect a battery. The bench test runs from USB. Leave the HAT's
  battery pad empty.
- With a multimeter in continuity mode, check that 3V3 and GND are not
  connected.
- Check there is no solder bridge between D4 and D5.

The Logger HAT is soldered, so for the bench test you cannot move the sensor
away from the XIAO. That matters for the readings; see step 7.

---

## 3. Install Arduino IDE and the ESP32 board

1. Install Arduino IDE 2.x from arduino.cc.
2. Open **File > Preferences**.
3. In **Additional boards manager URLs**, add:

   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```

4. Open **Tools > Board > Boards Manager**.
5. Search for `esp32` and install **esp32 by Espressif Systems**.
   Use version 3.x or newer; the Matter library is included.
6. Select **Tools > Board > esp32 > XIAO_ESP32C6**.
7. Select **Tools > Partition Scheme > Huge APP (3MB No OTA/1MB SPIFFS)**.
   The Matter library is large; the default 1.2 MB app partition is too small.
8. Select the correct USB port under **Tools > Port**.

If the board is not detected:

- Use a USB-C **data** cable, not a charge-only cable.
- Hold the **BOOT** button, plug in USB, then release. The board enters
  bootloader mode. Select the port and upload.

---

## 4. Install the sensor library

1. Open **Tools > Manage Libraries**.
2. Search for `Adafruit SHT4x` and install it. The Logger HAT carries a
   standard SHT40 at `0x44`, so this library works unchanged.
3. Install `Adafruit Unified Sensor` if the Library Manager asks for it.
4. Install `Adafruit BusIO` if asked.

---

## 5. Upload the bench sketch

1. Open `firmware/bench/bench.ino` from this repository.
2. Check the top of the sketch:
   - Wi-Fi is selected (the sketch calls `Matter.selectNetwork(MATTER_NETWORK_WIFI)`).
   - I2C uses GPIO22 (SDA) and GPIO23 (SCL).
   - D10 (GPIO18) is driven HIGH to power the HAT sensors.
3. Click **Upload**.
4. Open **Tools > Serial Monitor** at **115200 baud**.

You should see something like:

```
Garden sensor bench test
SHT40 found.
Manual pairing code: 34970112332
QR code URL: https://project-chip.github.io/connectedhomeip/qrcode.html?data=...
Temperature: 21.34 C  Humidity: 48.72 %
```

If you see `SHT40 not found`, stop and check the HAT solder joints. Run
`firmware/tools/i2c-scan/i2c-scan.ino` to see which addresses are detected.
With the Logger HAT you should see `0x23` (BH1750), `0x44` (SHT40) and
`0x51` (PCF8563 clock).

---

## 6. Pair it with Home Assistant

1. Make sure your phone is on the same Wi-Fi network as Home Assistant.
2. Make sure the XIAO is powered and the serial monitor is open.
3. Open the **Home Assistant Companion app**.
4. Go to **Settings > Connectivity > Matter > Add device**.
5. Choose **No, it's new**.
6. Scan the QR code from the URL printed in the serial monitor, or type the
   manual pairing code.
7. Follow the prompts. Choose Home Assistant as the controller.
8. The phone sends the Wi-Fi credentials to the XIAO over Bluetooth.
9. The XIAO joins Wi-Fi, and the Matter Server commissions it.
10. When it finishes, Home Assistant shows the device.

**The XIAO only supports 2.4 GHz Wi-Fi.** If your router has separate
2.4 GHz and 5 GHz names, use the 2.4 GHz one. If the names are combined,
it usually works, but the phone must be on the same network as Home
Assistant.

**Keep the phone close to the XIAO during pairing.** Bluetooth range is
only a few metres.

### If Android refuses the device

Google's Matter setup may reject a homemade device because it does not
recognise the maker. You have two options:

**Option A — register the test device in the Google Home Developer Console**

The test vendor ID is `0xFFF1` and the product ID is `0x8000`. The Nabu Casa
Matter example page describes the process:

- [Matter example installer and Android note](https://nabucasa.github.io/matter-example-apps/)
- [Google Home Developer Console — Get started with Matter](https://developers.home.google.com/matter/get-started)

This is a one-time setup for your Google account.

**Option B — borrow an iPhone or iPad for the first pairing**

The iOS Home Assistant Companion app shows an "Uncertified Accessory"
warning and lets you continue. Once the device is paired to Home Assistant,
you can control it from Android normally.

If neither option works, tell me and we will try commissioning directly
from the Raspberry Pi instead.

---

## 7. Check the result

In Home Assistant:

1. Go to **Settings > Devices & services > Matter**.
2. Open the new device (it should be called "Garden Sensor" or similar).
3. You should see:
   - a temperature entity
   - a humidity entity

Compare the readings with a normal room thermometer. Small differences are
normal. Write down the offset in the journey log.

**Expect the temperature to read high.** The SHT40 is on a board pressed
against the XIAO, which runs warm while it holds a Wi-Fi connection. Note
the offset after the board has been on for 10-15 minutes. This is the first
real measurement for the sensor placement decision in the outdoor build; see
[Enclosure](09-enclosure.md#vent-and-sensor-placement).

The serial monitor should print a new reading every 5 seconds.

---

## 8. What success looks like

- [ ] The I2C scan lists `0x23`, `0x44` and `0x51`.
- [ ] The serial monitor says `SHT40 found`.
- [ ] The board connects to Wi-Fi.
- [ ] Home Assistant shows the device.
- [ ] Temperature changes when you breathe on the sensor or move it.
- [ ] Humidity changes when you breathe on the sensor.
- [ ] The device stays online for at least 30 minutes.

---

## 9. Common problems

| Symptom | Likely cause | Fix |
|---|---|---|
| No serial port | Charge-only USB cable, or board not in bootloader | Use a data cable; hold BOOT while plugging in |
| Upload fails | Wrong board or port | Select `XIAO_ESP32C6` and the correct port |
| `SHT40 not found` | HAT solder joints, or D10 not driven | Reflow the HAT pads; run the I2C scanner; check the sketch sets D10 HIGH |
| Temperature is always 0 | Sensor not read | Check the I2C address; check the sketch |
| Temperature reads high | The HAT is warmed by the XIAO | Normal for a stacked board; write down the offset and see [Troubleshooting](12-troubleshooting.md) |
| Pairing fails | Phone too far, wrong Wi-Fi, Android refuses | Move closer; use 2.4 GHz; use the Android workaround |
| Device not in HA | Matter Server did not see it | Check `docker logs matter-server --tail 100` on the Pi |
| Device reboots every 5 minutes | `matterWaitUntilReady` timeout | The sketch uses `matterWaitUntilReady(0)` to wait forever; check the serial log |

For more, see [Troubleshooting](12-troubleshooting.md).

---

## 10. Play around (optional)

This phase is for learning the parts. Good first experiments:

1. **Self-heating:** log the SHT40 temperature against a room thermometer for
   an hour. Does the offset shrink if you stop Matter/Wi-Fi traffic?
2. **Light:** read the BH1750 at `0x23` with the `BH1750` library from the
   Library Manager. Cover it with a hand, then shine a phone torch on it.
3. **Clock:** read the PCF8563 at `0x51`. It keeps time with almost no
   current, which helps the final low-power firmware.
4. **Battery divider:** later, with a protected cell wired to the HAT's
   battery pad (see [Battery](08-battery.md#battery-voltage-measurement)),
   drive D10 HIGH and read the voltage on D1.

None of these is needed for the project to move on.

---

## 11. Next step

Once the bench test works:

1. Decide where the sensor lives in the outdoor build. If the offset in step 7
   is too large, add a separate sensor on a short cable (for example an
   SHT45 breakout); see the shopping list.
2. Order the outdoor kit (see the shopping list).
3. Order or borrow the Thread border router.
4. We build the low-power ESP-IDF firmware and measure the battery draw.

Do not put the bench build in a box yet. Finish the firmware and the
battery test first.
