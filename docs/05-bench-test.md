# Bench test, step by step

**Goal:** see real temperature and humidity from the SHT40 in Home Assistant,
using the XIAO ESP32-C6 over Wi-Fi and USB power.

This is the first "it works" milestone. No battery, no Thread, no box yet.

---

## 1. What you need

- Seeed XIAO ESP32-C6
- SHT40 breakout
- Breadboard
- 4 jumper wires (male-female)
- USB-C data cable
- Arduino IDE on your computer
- Home Assistant Companion app on your Android phone
- Your 2.4 GHz Wi-Fi name and password

---

## 2. Wire the sensor

The XIAO uses 3.3 V logic. Power the SHT40 breakout from **3V3**, not 5V.

| XIAO ESP32-C6 | SHT40 breakout |
|---|---|
| 3V3 | VIN or VCC |
| GND | GND |
| D4 (GPIO22) | SDA |
| D5 (GPIO23) | SCL |

```
XIAO ESP32-C6                 SHT40 breakout
+-----------+                 +-------------+
|      3V3  |-----------------| VIN         |
|      GND  |-----------------| GND         |
| D4 (SDA)  |-----------------| SDA         |
| D5 (SCL)  |-----------------| SCL         |
+-----------+                 +-------------+
```

**Before powering up:**

- Check that 3V3 goes to VIN, not to GND.
- Check that GND goes to GND.
- Check that SDA goes to SDA and SCL to SCL.
- The Adafruit breakout has pull-up resistors and a level shifter, so no
  extra resistors are needed for the bench test.

If you use a bare SHT40 module instead of a breakout, add 4.7 kΩ pull-ups
from SDA and SCL to 3.3 V, unless the module already has them.

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
2. Search for `Adafruit SHT4x` and install it.
3. Install `Adafruit Unified Sensor` if the Library Manager asks for it.
4. Install `Adafruit BusIO` if asked.

---

## 5. Upload the bench sketch

1. Open `firmware/bench/bench.ino` from this repository.
2. Check the top of the sketch:
   - Wi-Fi is selected (the sketch calls `Matter.selectNetwork(MATTER_NETWORK_WIFI)`).
   - I2C uses GPIO22 (SDA) and GPIO23 (SCL).
3. Click **Upload**.
4. Open **Tools > Serial Monitor** at **115200 baud**.

You should see something like:

```
Window sensor bench test
SHT40 found.
Manual pairing code: 34970112332
QR code URL: https://project-chip.github.io/connectedhomeip/qrcode.html?data=...
Temperature: 21.34 C  Humidity: 48.72 %
```

If you see `SHT40 not found`, stop and check the wiring. Run
`firmware/tools/i2c-scan/i2c-scan.ino` to see which address is detected. The SHT40
should appear at `0x44`.

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
2. Open the new device (it should be called "Window Sensor" or similar).
3. You should see:
   - a temperature entity
   - a humidity entity

Compare the readings with a normal room thermometer. Small differences are
normal. Write down the offset in the journey log.

The serial monitor should print a new reading every 5 seconds. That is only
for the bench. The final firmware reports every 1-2 hours to save battery.

---

## 8. What success looks like

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
| `SHT40 not found` | Wiring or power | Check 3V3, GND, SDA, SCL; run the I2C scanner |
| Temperature is always 0 | Sensor not read | Check the I2C address; check the sketch |
| Pairing fails | Phone too far, wrong Wi-Fi, Android refuses | Move closer; use 2.4 GHz; use the Android workaround |
| Device not in HA | Matter Server did not see it | Check `docker logs matter-server --tail 100` on the Pi |
| Device reboots repeatedly | `matterWaitUntilReady` timeout | The sketch uses `matterWaitUntilReady(0)` to wait forever; check the serial log |

For more, see [Troubleshooting](12-troubleshooting.md).

---

## 10. Next step

Once the bench test works:

1. Order the outdoor kit (see the shopping list).
2. Order the ZBT-2 and set up the OTBR container
   ([border router guide](14-thread-border-router.md)).
3. We build the low-power ESP-IDF firmware and measure the battery draw.

Do not put the bench build in a box yet. Finish the firmware and the
battery test first.
