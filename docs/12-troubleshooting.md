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

- Check 3V3 to VIN, GND to GND, D4 to SDA, D5 to SCL.
- Do not power the sensor from 5 V.
- Run `firmware/tools/i2c-scan/i2c-scan.ino`; the sensor should appear at `0x44`.
- Check the solder joints on the headers.
- Try another SHT40 breakout.

### Temperature or humidity is wrong

- Breathe on the sensor; both values should move.
- Keep the sensor away from the XIAO and the USB cable; they warm it.
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
- The chosen setup is a **ZBT-2** plus the **OpenThread Border Router**
  container on the Pi. See
  [the border router guide](14-thread-border-router.md).
- In Home Assistant, check **Settings > Devices & services > Thread**.
- If the Thread integration is empty, no border router has been discovered
  yet.

### OTBR container does not start

Check the logs first:

```bash
docker logs otbr --tail 100
```

Common causes:

- The USB device path is wrong. Use the stable path:
  `ls -l /dev/serial/by-id/`.
- The user is not in the `dialout` group. Run
  `sudo usermod -aG dialout $USER`, then log out and back in.
- The ZBT-2 still has Zigbee firmware. Flash OpenThread RCP firmware.
- The baud rate is wrong. Start with `460800` and check the firmware notes.
- `BACKBONE_IF` is not the Pi's real LAN interface. Check `ip link show`.
- Another container still claims the USB radio. Stop it.
- The container is not privileged or does not have `NET_ADMIN`.

Check the Thread state:

```bash
docker exec otbr ot-ctl state
```

### Thread integration shows no border router

- Add the **OpenThread Border Router** integration with the OTBR REST URL:
  `http://<pi-ip>:8081`.
- Restart Home Assistant and check again; mDNS discovery can be slow.
- Make sure OTBR and Home Assistant are on the same network model (both host
  networking, or both macvlan). A mix can break discovery.
- Check that port `8081` is reachable from the Home Assistant container.

### Thread credentials are missing

- On Android, open the Home Assistant Companion app.
- Go to **Settings > Companion app > Troubleshooting > Sync Thread credentials**
  (menu names move between versions).
- Or **Settings > Connectivity > Thread > Send credentials to Home Assistant**.
- In Home Assistant, open the Thread integration and make the OTBR network
  the **preferred network**.
- Enable **Android/iOS commissioning** in the Thread integration.

### Device joins Thread but is unreachable

Thread is IPv6-only. Check the host first:

```bash
sysctl net.ipv6.conf.all.forwarding
sysctl net.ipv6.conf.all.accept_ra_rt_info_max_plen
ip -6 route show | grep fd
```

Expected:

- IPv6 forwarding is `1`.
- `accept_ra_rt_info_max_plen` is at least `64`.
- There is an `fd.../64` route through the OTBR.

Then check the Matter Server container:

```bash
docker exec matter-server ip -6 route
docker exec matter-server ping6 -c 3 <thread-prefix>::1
```

Common causes:

- `matter-server` is on macvlan and never learned the Thread route.
- `matter-server` is on macvlan and Docker assigned a ULA address that the
  kernel prefers. The source address is wrong, so replies never come back.
- Home Assistant and `matter-server` are on different network models.
- The router or firewall blocks IPv6 multicast or router advertisements.
- The phone is on a different VLAN from the Pi.

The simplest fix is host networking for Home Assistant, `matter-server`, and
OTBR. If you keep macvlan, follow the ULA workaround in
[the border router guide](14-thread-border-router.md).

### Device drops offline randomly

- Weak signal. Move the border router or add a mains-powered Thread router.
- Check for 2.4 GHz Wi-Fi interference; try Thread channel 25 or 26.
- Check the battery voltage; a weak battery can cause resets.
- Check the Matter Server logs for `NoAck` or `Timeout`.
- Check the OTBR logs for repeated resets or radio errors.

---

## Battery

### Battery life is much shorter than expected

- Measure the sleep current.
- Check the report interval (1-2 hours is the target).
- Check the signal strength; a weak link causes retries.
- Check the LED; it should be off.
- Check the battery divider; it should draw only a few µA.
- Check the SHT40 breakout's regulator; some breakouts draw tens of µA when
  permanently powered. Power-gate the sensor or use a bare SHT40.
- If needed, report every 2 hours instead of 1. Do not go below that without
  accepting a slower response.

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

## Window and outdoor

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

- The sensor is in the sun, too close to the window/wall, or too close to the
  XIAO/battery.
- Move it 10-15 cm away from the glass and wall.
- Improve the radiation shield; add more plates or a bigger air gap.
- Move the sensor to the bottom of the box.
- Use a white box and white shield.
- Compare with a shaded reference at the same time, away from the window.

### Humidity reads 100 % all the time

- Water may be on the sensor.
- Dry the sensor and check the PTFE membrane.
- Add a drip shield above the vent.
- If it persists, the sensor may be damaged; replace the breakout.

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

- If you kept the current macvlan setup, the Matter Server URL is
  `ws://192.168.1.239:5580/ws`. Check that Home Assistant and
  `matter-server` are on the same macvlan network.
- If you moved to host networking, the URL is
  `ws://<pi-ip>:5580/ws` (find the Pi's IP with `hostname -I`).
- Do not mix: Home Assistant on macvlan and `matter-server` on host networking
  can fail because a macvlan container cannot reach its own host.
- Check the Matter integration configuration in Home Assistant.
- Restart both containers after a network change.
- Do not change the network while devices are working.

### After moving to host networking

1. Confirm the Pi's LAN IP with `hostname -I`.
2. Update the Matter integration URL to `ws://<pi-ip>:5580/ws`.
3. Restart Home Assistant.
4. Open the Matter integration and check that the Anker Solix is still
   present.
5. If the Anker device is missing, do not factory reset it. Check
   `docker logs matter-server --tail 100`, verify the Pi can ping
   `192.168.1.120`, and check that the host has no firewall rule blocking the
   macvlan or LAN.

### The Anker device disappeared after a network change

- It is a Wi-Fi Matter device at `192.168.1.120`. It does not use Thread.
- Check that the Pi can reach it:
  `ping 192.168.1.120`.
- Check the Matter Server logs.
- Restore the `matter-server` backup if the controller data was damaged.
- Do not factory reset the Anker unless the manufacturer's instructions say
  so; re-commissioning a working device is unnecessary.

### Backups

Before changes:

```bash
ssh raspberrypi.local
sudo tar czf ~/matter-server-backup-$(date +%F).tar.gz \
  -C /home/azevefei/app-data matter-server
```

Also back up the Home Assistant config directory and the OTBR data volume.
The OTBR data contains the Thread network credentials.

---

## When to ask for help

Include:

- a photo of the wiring
- the serial monitor output
- the Home Assistant Matter diagnostics
- the Matter Server log around the failure
- the exact steps you took
- what changed since the last time it worked
