# Home Assistant setup

## Your current setup

From the files on the Raspberry Pi:

- Home Assistant runs in Docker (`homeassistant` container), at
  `192.168.1.238:8123`.
- Matter runs in a separate container (`matter-server`), at
  `192.168.1.239:5580`.
- Both are on a `macvlan` Docker network.
- The Matter Server has one device: a eufy robot vacuum, connected over Wi-Fi.
- There is no USB Thread radio and no OpenThread Border Router.
- The Pi's IPv6 routing table has no Thread route.

This is why a Wi-Fi Matter device works today, but a Thread device cannot.

## The missing piece: a Thread border router

A Thread border router is a separate device on your home network. It
translates between Thread and normal Wi-Fi/Ethernet.

For Android, the easiest option is a **Google Nest Hub (2nd gen)** or a
**Google TV Streamer**. A used Nest Hub 2 is the best value.

### Set up the Nest Hub

1. Plug in the Nest Hub and set it up in the **Google Home app** on your
   phone, on the same Wi-Fi as Home Assistant.
2. Make sure the Nest Hub is on the same network as the Pi.
3. In Home Assistant, install the **Thread** integration if it is not
   already installed:
   **Settings > Devices & services > Add integration > Thread**.
4. Open the **Home Assistant Companion app** on Android.
5. Go to **Settings > Companion app > Troubleshooting > Sync Thread credentials**
   (the exact menu may move between app versions).
6. Alternatively: **Settings > Connectivity > Thread > Send credentials to
   Home Assistant**.
7. In Home Assistant, go to **Settings > Connectivity > Thread** and check
   that the Google network appears and is the preferred network.

The Home Assistant Thread documentation is the source of truth:
<https://www.home-assistant.io/integrations/thread/>

### If you choose the ZBT-1 instead

A Home Assistant Connect ZBT-1 is cheaper, but your Home Assistant does not
run Home Assistant OS, so you cannot use the official add-on. You would run
an **OpenThread Border Router** Docker container on the Pi and pass the USB
radio through to it. This is a networking project on its own, and the
macvlan setup can make it harder. We will only do this if you want to save
the money and enjoy the debugging.

## Pairing the sensor

The standard path is the Home Assistant Companion app:

1. Phone and Home Assistant on the same Wi-Fi.
2. Phone Bluetooth on.
3. **Settings > Connectivity > Matter > Add device > No, it's new**.
4. Scan the QR code or type the manual code.
5. Choose Home Assistant as the controller.

For a Thread device, the phone must know the Thread network credentials.
The steps above ("Sync Thread credentials") handle that.

For a Wi-Fi bench device, the phone sends the Wi-Fi credentials over
Bluetooth; no Thread is involved.

### Android and homemade devices

Google's Matter setup may reject a homemade device. The two workarounds are:

- register the test vendor/product ID (`0xFFF1` / `0x8000`) in the Google
  Home Developer Console, or
- borrow an iPhone or iPad for the first pairing.

See [the bench guide](05-bench-test.md#6-pair-it-with-home-assistant) for the
details. This is a one-time setup, not a permanent limitation.

## Backups before adding devices

The Matter Server stores its data in:

```
/home/azevefei/app-data/matter-server
```

Before adding a new device, make a backup on the Pi:

```bash
ssh raspberrypi.local
sudo tar czf ~/matter-server-backup-$(date +%F).tar.gz \
  -C /home/azevefei/app-data matter-server
```

Also back up the Home Assistant config. The repo's `scripts/deploy.sh`
already backs up the rasp-home database, but the Matter Server data and the
Home Assistant `.storage` folder are separate.

Do not change the Docker network or the Matter Server IP while devices are
working.

## Checking the Matter Server

On the Pi:

```bash
docker ps --filter name=matter-server
docker logs matter-server --tail 100
```

Look for the device being commissioned, or for errors such as `NoAck`,
`Timeout`, or `CHIP Error`.

## Dashboard card

After the device is paired, add a simple card to your dashboard:

```yaml
type: entities
title: Garden sensor
entities:
  - entity: sensor.garden_temperature
  - entity: sensor.garden_humidity
  - entity: sensor.garden_battery
```

The exact entity IDs depend on the device name. You can find them in
**Settings > Devices & services > Matter > Garden Sensor**.

## Automation ideas

Once the sensor is stable:

- Frost warning: notify when the temperature is below 2 °C.
- Heat warning: notify when the temperature is above 38 °C.
- Humidity warning: notify when humidity stays above 90 % for an hour
  (mould/condensation risk).
- Battery warning: notify when battery percentage is below 20 %.
- Graph: temperature and humidity over 24 hours and 7 days.

Keep the first automation simple and test it with a manual trigger.

## Important limitations

- Home Assistant Container is not the officially supported installation for
  the Matter add-on. Your `matter-server` Docker setup works, but it is a
  community path. Keep backups.
- Matter Server and Home Assistant are on a macvlan network. They can talk
  to devices on the LAN, but macvlan has quirks. If Thread devices are not
  reachable, the first thing to check is the IPv6 route on the Matter Server.
- A homemade device is uncertified. Home Assistant will warn. That is fine
  for personal use.
