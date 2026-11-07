# Thread border router setup (ZBT-2 + Docker OTBR)

This is the detailed setup for the chosen border router: a **Home Assistant
Connect ZBT-2** USB radio plus a standalone **OpenThread Border Router
(OTBR)** container on the Raspberry Pi.

The short version: the ZBT-2 is only a radio. OTBR is the software that turns
it into a border router. Home Assistant and `matter-server` must be able to
reach the IPv6 prefix that OTBR advertises.

If you use a used Nest Hub 2 instead, see the fallback at the end.

---

## 1. What you need

- Home Assistant Connect ZBT-2 (the ZBT-1 is discontinued; a used one works).
- Raspberry Pi running Home Assistant and `matter-server` in Docker.
- The ZBT-2 USB-C cable (included).
- A backup of the `matter-server` data.
- About an evening for the Docker and IPv6 work.

Check the current state on the Pi:

```bash
docker ps
ls -l /dev/serial/by-id/
hostname -I
ip -6 route
```

---

## 2. Decide the network model first

Thread is IPv6-only. There are two coherent designs. **Do not mix them.**

### Recommended: host networking for HA, matter-server, and OTBR

- All three containers use `network_mode: host`.
- The Pi's LAN IP is the address for Home Assistant, the Matter Server
  WebSocket, and the OTBR REST API.
- IPv6 routes and mDNS are easiest to get right.

Trade-off: the Home Assistant URL changes from `192.168.1.238:8123` to the
Pi's LAN IP. Update bookmarks and the Companion app.

### Advanced: keep everything on macvlan

- Keep Home Assistant and `matter-server` on the existing macvlan network.
- Add OTBR on the same macvlan network with its own static IP.
- Enable IPv6 on the macvlan network (Docker does not enable it by default)
  and enable router-advertisement route information on the interface.
- Avoid the Docker-assigned ULA source-address problem.

Trade-off: nothing in Home Assistant changes, but this path has more moving
parts. Try it only if changing the HA IP is unacceptable.

### Never mix

Do not leave Home Assistant on macvlan and move only `matter-server` to host
networking. A macvlan container cannot reach its own Docker host, so Home
Assistant may lose the Matter Server connection.

---

## 3. Back up before touching anything

On the Pi:

```bash
sudo tar czf ~/matter-server-backup-$(date +%F).tar.gz \
  -C /home/azevefei/app-data matter-server
```

Also back up:

- the Home Assistant config directory,
- the `matter-server` credentials directory,
- the OTBR data volume after the first successful setup.

The OTBR data contains the Thread network credentials. Losing it means
re-commissioning the sensor.

---

## 4. Flash the ZBT-2 to Thread firmware

The ZBT-2 ships as a Zigbee radio. It runs one protocol at a time.

1. Unplug the ZBT-2 from the Pi.
2. Plug it into a computer with Chrome/Edge.
3. Open the Open Home Foundation toolbox:
   <https://toolbox.openhomefoundation.org/home-assistant-connect-zbt-2/>
4. Choose the **Thread / OpenThread RCP** firmware and flash it.
5. Replug it into the Pi.

If the web flasher does not work, use Nabu Casa's
[`universal-silabs-flasher`](https://github.com/NabuCasa/universal-silabs-flasher).

Find the stable device path:

```bash
ls -l /dev/serial/by-id/
```

You will see something like:

```
usb-Nabu_Casa_Connect_ZBT-2_XXXXXXXXXXXX-if00 -> ../../ttyACM0
```

Use the `by-id` path in the compose file. Do not use `/dev/ttyACM0` directly;
the number can change after a reboot.

Add your user to the serial group if needed:

```bash
sudo usermod -aG dialout $USER
```

Log out and back in.

---

## 5. Enable IPv6 forwarding on the Pi

Create a sysctl file:

```bash
sudo tee /etc/sysctl.d/99-thread.conf >/dev/null <<'EOF'
net.ipv4.conf.all.forwarding=1
net.ipv6.conf.all.forwarding=1
net.ipv6.conf.all.accept_ra=2
net.ipv6.conf.all.accept_ra_rt_info_max_plen=64
EOF
sudo sysctl --system
```

Load the IPv6 firewall module if it is available:

```bash
sudo modprobe ip6table_filter
```

Verify:

```bash
sysctl net.ipv6.conf.all.forwarding
sysctl net.ipv6.conf.all.accept_ra_rt_info_max_plen
```

The first should be `1`; the second should be at least `64`.

`accept_ra=2` means the Pi keeps accepting router advertisements even though
it is forwarding. That is what lets it learn the Thread route.

---

## 6. Run the OTBR container

The recommended image is the community
[`ownbee/hass-otbr-docker`](https://github.com/ownbee/hass-otbr-docker). It
packages the Home Assistant OTBR add-on for plain Docker. It is not an
official HA add-on, so keep backups.

Create a folder:

```bash
mkdir -p ~/otbr
cd ~/otbr
```

`docker-compose.yml`:

```yaml
services:
  otbr:
    container_name: otbr
    image: ghcr.io/ownbee/hass-otbr-docker:latest
    restart: unless-stopped
    privileged: true
    network_mode: host
    cap_add:
      - SYS_ADMIN
      - NET_ADMIN
    devices:
      - /dev/serial/by-id/usb-Nabu_Casa_Connect_ZBT-2_XXXXXXXXXXXX-if00:/dev/ttyUSB0
      - /dev/net/tun:/dev/net/tun
    environment:
      DEVICE: /dev/ttyUSB0
      BAUDRATE: 460800
      FLOW_CONTROL: 1
      BACKBONE_IF: eth0
      FIREWALL: 1
      NAT64: 0
      OTBR_REST_PORT: 8081
      OTBR_WEB_PORT: 8080
      OTBR_LOG_LEVEL: info
      AUTOFLASH_FIRMWARE: 0
    volumes:
      - ./otbr_data:/var/lib/thread
```

Replace the `by-id` path with yours. Replace `eth0` with the Pi's real LAN
interface from `ip link show`.

`BAUDRATE: 460800` and `FLOW_CONTROL: 1` match the OpenThread RCP firmware.
If OTBR cannot open the radio, try `FLOW_CONTROL: 0` and check the firmware
notes for the ZBT-2.

Start it:

```bash
docker compose up -d
docker logs otbr --tail 100
```

Look for a line like `Border router web started on wpan0`.

Check the Thread state:

```bash
docker exec otbr ot-ctl state
```

It should report `leader` or `router`, not `disabled`.

The web UI is at `http://<pi-ip>:8080`, and the REST API is at
`http://<pi-ip>:8081`. Do not expose either to the internet.

---

## 7. Put matter-server (and Home Assistant) on host networking

Only if you chose the recommended model.

Edit the Home Assistant compose file. The important parts:

```yaml
services:
  homeassistant:
    # ...
    network_mode: host

  matter-server:
    image: ghcr.io/home-assistant-libs/python-matter-server:stable
    container_name: matter-server
    restart: unless-stopped
    network_mode: host
    security_opt:
      - apparmor:unconfined
    volumes:
      - /home/azevefei/app-data/matter-server:/data
      - /run/dbus:/run/dbus:ro
```

Remove the old macvlan network entries from both services. Remove any
`ports:` mappings too; with host networking the services bind directly to
the Pi's interfaces. Keep the data volumes.

Restart:

```bash
docker compose up -d
```

Find the Pi's IP:

```bash
hostname -I
```

Update the Home Assistant Matter integration URL to:

```
ws://<pi-ip>:5580/ws
```

Open Home Assistant at `http://<pi-ip>:8123`, then check that the Anker Solix
is still present. If it is missing, check the Matter Server logs before
changing anything else.

---

## 8. Add the Home Assistant integrations

1. **Settings > Devices & services > Add integration**.
2. Add **OpenThread Border Router**.
3. Use `http://<pi-ip>:8081` as the REST URL.
4. Add **Thread** if it is not already present.
5. Open the Thread integration, select the OTBR network, and make it the
   **preferred network**.
6. Enable **Android/iOS commissioning**.
7. On Android, open the Companion app and sync the Thread credentials:
   **Settings > Companion app > Troubleshooting > Sync Thread credentials**.

If the Thread integration does not discover the network, restart Home
Assistant and check the OTBR logs again.

---

## 9. Verify the IPv6 route

On the Pi:

```bash
ip -6 route show | grep fd
```

You should see a route for the Thread prefix through `wpan0` or the OTBR.

From the Matter Server container:

```bash
docker exec matter-server ip -6 route
docker exec matter-server ping6 -c 3 <thread-prefix>::1
```

If there is no `fd` route, or ping fails, see the troubleshooting section.

---

## 10. Pair the sensor

1. Power the sensor.
2. Open the Home Assistant Companion app on Android.
3. **Settings > Connectivity > Matter > Add device > No, it's new**.
4. Scan the QR code or type the manual code.
5. Choose Home Assistant as the controller.
6. The phone sends the Thread credentials over Bluetooth.
7. The sensor joins the Thread network and the Matter Server commissions it.

If Android refuses the homemade device, see
[the bench guide](05-bench-test.md#6-pair-it-with-home-assistant).

---

## Option B: keep everything on macvlan

This is the advanced path. Use it only if the HA IP cannot change.

1. Keep Home Assistant and `matter-server` on the existing macvlan network.
2. Run OTBR on the **same macvlan network** with a static IP, for example
   `192.168.1.240`.
3. The macvlan interface must accept router advertisements and route
   information:
   - `net.ipv6.conf.<iface>.accept_ra=2`
   - `net.ipv6.conf.<iface>.accept_ra_rt_info_max_plen=64`
4. Avoid Docker assigning a ULA address that the kernel prefers as the source
   for Thread traffic. If `matter-server` has an `fd...` address on its LAN
   interface, that is the usual cause of "Network is unreachable" during
   commissioning.
5. Verify from `matter-server`:
   `ip -6 route` shows the Thread `fd` prefix, and
   `ping6 <thread-prefix>::1` works.

This is the setup described in the
[python-matter-server macvlan issue](https://github.com/matter-js/python-matter-server/issues/983).
Budget debugging time. If it fights you, move all three containers to host
networking instead.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| OTBR restarts immediately | Wrong device path, wrong baud, or Zigbee firmware | Check `docker logs otbr`; use the `by-id` path; re-flash Thread firmware |
| `ot-ctl state` says disabled | Radio not detected or OTBR not formed | Check the device mapping and logs |
| HA cannot add the OTBR integration | Port 8081 not reachable, or wrong network model | Check `curl http://<pi-ip>:8081/node` from the Pi |
| Thread integration empty | mDNS discovery failed | Restart HA; check both are on host or both on macvlan |
| Device joins but is unreachable | Missing IPv6 route or ULA source problem | Check `ip -6 route` in `matter-server`; see Option B |
| Commissioning says "Network is unreachable" | Docker IPv6 or macvlan ULA issue | Use host networking for all three |
| Anker Wi-Fi device disappeared | Matter Server data or network change | Check logs; restore backup; do not factory reset the Anker |
| Weak signal at the window | Distance, metal, or interference | Move the Pi/ZBT-2, add a mains Thread router, external antenna |

Useful commands:

```bash
docker ps
docker logs otbr --tail 100
docker logs matter-server --tail 100
docker exec otbr ot-ctl state
docker exec matter-server ip -6 route
ip -6 route show | grep fd
sysctl net.ipv6.conf.all.forwarding
sysctl net.ipv6.conf.all.accept_ra_rt_info_max_plen
```

---

## Nest Hub 2 fallback

If the Docker OTBR path is too much, use a used Nest Hub (2nd gen):

1. Set it up in the Google Home app on the same Wi-Fi as Home Assistant.
2. In Home Assistant, add the **Thread** integration.
3. On Android, open the Companion app and sync the Thread credentials.
4. Make the Google network the preferred network.
5. Pair the sensor the same way.

The Nest Hub avoids the OTBR container, but the Thread network is Google-owned
and you still need working IPv6 from `matter-server` to the Thread prefix.

---

## Security and maintenance

- Do not expose ports `8080` or `8081` to the internet.
- Keep the OTBR container and the ZBT-2 firmware updated.
- Back up the OTBR data volume before updates.
- The ZBT-2 runs one protocol at a time. Do not try to use it for Zigbee while
  it is the Thread border router.
- If you re-flash the ZBT-2, the Thread network may need to be re-formed. Back
  up first.
