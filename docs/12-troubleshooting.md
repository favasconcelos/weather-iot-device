# Troubleshooting

## Bench test

### No serial port appears

- The USB cable may be charge-only. Use a data cable.
- Hold **BOOT**, plug in USB, release. The board enters bootloader mode.
- Try another USB port or another cable.
- On Linux, check `ls /dev/ttyACM* /dev/ttyUSB*`.

### Upload fails

- Select the board **XIAO_ESP32C6**.
- Select **Partition Scheme > Huge APP (3MB No OTA/1MB SPIFFS)**. The Matter
  library is too large for the default partition.
- Select the correct port.
- Close the serial monitor before uploading.
- Hold BOOT while plugging in, then upload.
- If it still fails, erase the flash:
  `esptool.py --port /dev/ttyACM0 erase_flash`.

### `SHT40 not found`

- Check the solder joints between the Logger HAT and the XIAO pins, especially
  3V3, GND, D4, D5 and D10.
- Make sure the HAT is the right way round, with pin labels over matching pins.
- The sensors are powered from D10 (GPIO18). The sketch drives it HIGH; make
  sure you did not change it.
- Do not power the HAT from 5 V.
- Run `firmware/tools/i2c-scan/i2c-scan.ino`; with the HAT you should see
  `0x23`, `0x44` and `0x51`. If you see `0x51` but not `0x23` or `0x44`, the
  sensor power (D10) may not be reaching them.
- Reflow the pads with fresh flux. Bridges and cold joints are the usual cause.

### Temperature or humidity is wrong

- Breathe on the sensor; both values should move.
- Keep the sensor away from the XIAO and the USB cable; they warm it. The
  Logger HAT sits directly on the XIAO, so expect an offset in the bench
  test, especially after the board has been running Wi-Fi for a while.
  Write the offset down.
- Wait a few minutes after power-up for the reading to settle.
- Compare with a known thermometer; note the offset.
- The SHT40 is accurate to about ±0.2 °C and ±1.8 % RH, but self-heating
  and placement can add an offset.

### Pairing fails

- Phone Bluetooth is on.
- Phone and Home Assistant are on the same Wi-Fi network.
- The XIAO is powered and the serial monitor shows the pairing code.
- Move the phone closer to the XIAO.
- Use the 2.4 GHz Wi-Fi network; the XIAO does not support 5 GHz.
- Try the manual code instead of the QR code.
- If Android refuses the device, see the Android section below.

### Android refuses the homemade device

Google's Matter setup may reject an uncertified device. Options:

1. Register the test vendor/product ID (`0xFFF1` / `0x8000`) in the Google
   Home Developer Console. See
   [the Nabu Casa note](https://nabucasa.github.io/matter-example-apps/) and
   [Google's Matter guide](https://developers.home.google.com/matter/get-started).
2. Borrow an iPhone or iPad for the first pairing. iOS shows an
   "Uncertified Accessory" warning and lets you continue.
3. Commission directly from the Raspberry Pi (advanced; we will try this
   together if needed).

### Device does not show in Home Assistant

- Check the Matter Server logs on the Pi:

  ```bash
  docker logs matter-server --tail 100
  ```

- Reload the Matter integration in Home Assistant.
- Check that the device is on the same network as the Matter Server.
- Check the Matter Server's IPv6 address and route:

  ```bash
  docker exec matter-server ip -6 addr
  docker exec matter-server ip -6 route
  ```

- If the device is on Wi-Fi, check that the 2.4 GHz network is reachable.

---

## Thread

### "This device requires a border router"

- You need a Thread border router. A Matter Server alone is not enough.
- Set up a Google Nest Hub 2, Google TV Streamer, or another known-working
  border router.
- In Home Assistant, check **Settings > Connectivity > Thread**.

### Thread credentials are missing

- On Android, open the Home Assistant Companion app.
- Go to **Settings > Companion app > Troubleshooting > Sync Thread credentials**
  (menu names move between versions).
- Or **Settings > Connectivity > Thread > Send credentials to Home Assistant**.
- Check that the Google network appears in Home Assistant and is preferred.

### Device joins Thread but is unreachable

- Check the Thread network map in Home Assistant.
- Move the border router closer, or add a mains-powered Thread router.
- Check the Matter Server's IPv6 route:

  ```bash
  docker exec matter-server ip -6 route
  ```

- The Matter Server is on a macvlan network. If it does not receive the
  Thread route, we may need to add a static route or adjust the container.
  This is a known area to debug.

### Device drops offline randomly

- Weak signal. Move the border router or add a Thread router.
- Check for 2.4 GHz Wi-Fi interference; try Thread channel 25 or 26.
- Check the battery voltage; a weak battery can cause resets.
- Check the Matter Server logs for `NoAck` or `Timeout`.

---

## Battery

### Battery life is much shorter than expected

- Measure the sleep current.
- Check the report interval (5 minutes is the target).
- Check the signal strength; a weak link causes retries.
- Check the LED; it should be off.
- Check the battery divider; it should draw only a few µA.
- Check that D10 is driven LOW before sleep (the Logger HAT sensors and divider are switched by it), and check the regulator on any separate sensor breakout; some draw tens of µA.
- If needed, report every 10-15 minutes instead of 5.

### The device resets when the radio transmits

- The battery may be too weak or the fuse/holder has a bad contact.
- Check the battery voltage under load.
- Use a protected cell with a good current rating.
- Check the solder joints and the fuse holder.

### The charger LED does not turn off

- The battery may be old or damaged.
- The USB cable or charger may be weak.
- Disconnect and check the battery voltage. If it is below 2.5 V, the cell
  may be damaged; do not charge it.

### The battery voltage reading is wrong

- Check the divider values (1 MΩ + 1 MΩ).
- Check the A0 wiring.
- Add the 100 nF capacitor.
- Calibrate with a multimeter: measure the battery voltage, compare with the
  firmware reading, and apply an offset.

---

## Outdoor

### Water inside the box

- Dry everything immediately.
- Find the leak: gasket, cable gland, vent, LED window, or screw holes.
- Replace the gasket; add neutral-cure silicone where needed.
- Repeat the paper-towel test before powering up.

### Condensation inside

- Add or replace the desiccant.
- Check the Gore vent; it may be blocked or missing.
- Apply conformal coating to the PCB.
- Avoid sealing warm, humid air inside the box.

### Temperature reads too high

- The sensor is in the sun or too close to the XIAO/battery.
- Improve the radiation shield; add more plates or a bigger air gap.
- Move the sensor to the bottom of the box.
- Use a white box and white shield.
- Compare with a shaded reference at the same time.

### Humidity reads 100 % all the time

- Water may be on the sensor.
- Dry the sensor and check the PTFE membrane.
- Add a drip shield above the vent.
- If it persists, the sensor may be damaged; replace the Logger HAT or the breakout.

### The LED is not visible

- The LED may be off by design. Use the magnet to request status.
- Add a light pipe or a clear epoxy window.
- Check the LED polarity and resistor.

---

## Home Assistant / Docker

### Matter Server container is not running

```bash
docker ps --filter name=matter-server
docker logs matter-server --tail 100
docker restart matter-server
```

### Home Assistant cannot reach the Matter Server

- Check the Matter Server IP (`192.168.1.239` in the current setup).
- Check the HA Matter integration configuration.
- Check that both containers are on the same macvlan network.
- Do not change the network while devices are working.

### Backups

Before changes:

```bash
ssh raspberrypi.local
sudo tar czf ~/matter-server-backup-$(date +%F).tar.gz \
  -C /home/azevefei/app-data matter-server
```

Also back up the Home Assistant config directory.

---

## When to ask for help

Include:

- a photo of the wiring
- the serial monitor output
- the Home Assistant Matter diagnostics
- the Matter Server log around the failure
- the exact steps you took
- what changed since the last time it worked
