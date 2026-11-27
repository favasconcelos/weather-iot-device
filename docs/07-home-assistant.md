# Home Assistant setup

## Your current setup

From the files on the Raspberry Pi:

- Home Assistant runs in Docker (`homeassistant` container), at
  `192.168.1.238:8123`.
- Matter runs in a separate container (`matter-server`), at
  `192.168.1.239:5580`.
- Both are on a `macvlan` Docker network.
- The Matter Server has one device: an **eufy robot vacuum**, connected over
  **Wi-Fi**.
- There is no USB Thread radio and no OpenThread Border Router.
- The Pi's IPv6 routing table has no Thread route.

This is why a Wi-Fi Matter device works today, but a Thread device cannot.
The eufy device does not need Thread, and it should keep working after the
changes below.

The border router is **not bought yet**. This page is the plan for when it
arrives; nothing here is urgent until then.

## Target setup

| Piece | Target |
|---|---|
| Home Assistant | Docker container on the Pi |
| Matter Server | Docker container on the Pi |
| Thread border router | ZBT-2 USB radio + OpenThread Border Router container on the Pi |
| Sensor | Matter over Thread, battery powered |

The ZBT-2 is only a radio. The OTBR software is what makes it a border
router. The full setup is in
[the border router guide](14-thread-border-router.md).

## Pick one network model

Thread is IPv6-only. The network model matters more than any other setting.
There are two coherent options. **Do not mix them.**

### Option A — host networking for everything (recommended)

Move Home Assistant, `matter-server`, and OTBR to `network_mode: host`.

- This is the most documented Thread setup.
- IPv6 routes, mDNS, and discovery work without macvlan workarounds.
- The Home Assistant URL changes from `192.168.1.238:8123` to the Pi's LAN
  IP (`hostname -I`), for example `192.168.1.100:8123`.
- The Matter integration URL changes to `ws://<pi-ip>:5580/ws`.
- Update bookmarks, the Companion app URL, and any dashboard links.

### Option B — keep everything on macvlan (advanced)

Keep Home Assistant and `matter-server` where they are, and add OTBR on the
same macvlan network with its own static IP.

- The HA URL does not change.
- You must enable IPv6 on the macvlan network (Docker does not enable it by
  default).
- The container must accept router-advertisement route information
  (`accept_ra_rt_info_max_plen=64`).
- Docker can assign a ULA address that the kernel prefers over the routable
  address; that breaks Thread commissioning. The workaround is to avoid the
  Docker ULA or add a specific route. This is the part that takes an evening.

### Why not move only `matter-server` to host networking?

A macvlan container cannot reach its own Docker host. If Home Assistant stays
on macvlan and `matter-server` moves to host networking, Home Assistant may
not be able to connect to `matter-server`. Move all three, or keep all three
on macvlan.

## The border router: ZBT-2

The preferred part is the **Home Assistant Connect ZBT-2**. It is not
ordered yet. The ZBT-1 is discontinued; a used one still works if you
already have it.

Summary of the setup (details in
[the border router guide](14-thread-border-router.md)):

1. Back up `matter-server` and the HA config.
2. Flash the ZBT-2 with OpenThread RCP firmware. It ships as Zigbee.
3. Enable IPv6 forwarding and router-advertisement route information on the
   Pi.
4. Run the standalone OTBR container with the ZBT-2 passed through.
5. Add the **OpenThread Border Router** integration in Home Assistant at
   `http://<pi-ip>:8081`.
6. Add the **Thread** integration, set the network as preferred, and enable
   Android/iOS commissioning.
7. Pair the sensor with the Companion app.

## If you use a Nest Hub instead

A used Nest Hub (2nd gen) avoids the OTBR container, but the Thread network is
owned by Google.

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

Even with a Nest Hub, the IPv6 route from `matter-server` to the Thread
prefix must work. If `matter-server` stays on macvlan, the ULA workaround in
[the border router guide](14-thread-border-router.md) still applies.

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

## Backups before changing the network

The Matter Server stores its data in:

```
/home/azevefei/app-data/matter-server
```

Before adding a new device or changing the Docker network, make a backup on
the Pi:

```bash
ssh raspberrypi.local
sudo tar czf ~/matter-server-backup-$(date +%F).tar.gz \
  -C /home/azevefei/app-data matter-server
```

Also back up:

- the Home Assistant config directory,
- the OTBR data volume (it contains the Thread network credentials),
- the `matter-server` credentials directory.

Do not change the Docker network or the Matter Server IP while devices are
working. Change one thing, restart, and verify the eufy device before
continuing.

## Changing matter-server to host networking

Only if you chose Option A.

1. Stop `matter-server` and Home Assistant.
2. Back up both data directories.
3. Edit the compose file:
   - remove the macvlan network from `matter-server` and Home Assistant,
   - set `network_mode: host` for both,
   - remove any `ports:` mappings (host networking binds directly),
   - keep the `/data` and `/run/dbus` volumes,
   - start the containers.
4. In Home Assistant, edit the Matter integration URL to
   `ws://<pi-ip>:5580/ws`.
5. Restart Home Assistant and check that the eufy robot vacuum is still
   present and controllable.
6. Continue with the OTBR container.

If Home Assistant stays on macvlan, do not do this. Use Option B instead.

## Checking the Matter Server

On the Pi:

```bash
docker ps --filter name=matter-server
docker logs matter-server --tail 100
```

Look for the device being commissioned, or for errors such as `NoAck`,
`Timeout`, `Network is unreachable`, or `CHIP Error`.

For Thread routing, also check:

```bash
docker exec matter-server ip -6 addr
docker exec matter-server ip -6 route
```

A Thread route starts with `fd`. If it is missing, see
[Troubleshooting](12-troubleshooting.md).

## Dashboard card

After the device is paired, add a simple card to your dashboard:

```yaml
type: entities
title: Window sensor
entities:
  - entity: sensor.window_temperature
  - entity: sensor.window_humidity
  - entity: sensor.window_battery
```

The exact entity IDs depend on the device name. You can find them in
**Settings > Devices & services > Matter > Window Sensor**.

## Automation ideas

Once the sensor is stable:

- Frost warning: notify when the temperature is below 2 °C.
- Heat warning: notify when the temperature is above 38 °C.
- Humidity warning: notify when humidity stays above 90 % for an hour
  (mould/condensation risk).
- Battery warning: notify when battery percentage is below 20 %.
- Graph: temperature and humidity over 24 hours and 7 days.

Keep the first automation simple and test it with a manual trigger. Remember
that the sensor reports every 1-2 hours, so automations should not expect
per-minute data.

## Important limitations

- Home Assistant Container is not the officially supported installation for
  the Matter add-on. Your `matter-server` Docker setup works, but it is a
  community path. Keep backups.
- Thread needs IPv6 and multicast. A mixed host/macvlan setup, a VLAN between
  the phone and the Pi, or a router that blocks IPv6 will cause commissioning
  failures.
- A Thread device stays reachable between reports through its ICD poll, but
  it is not a live-data device. Home Assistant will show the last reported
  value.
- A homemade device is uncertified. Home Assistant will warn. That is fine
  for personal use.
