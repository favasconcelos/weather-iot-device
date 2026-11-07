# Final firmware

This folder will contain the real window firmware:

- ESP-IDF
- Espressif Matter SDK
- Matter over Thread
- ICD / sleepy device
- 1-2 hour report interval
- SHT40 driver
- battery measurement
- LED patterns
- reed switch

The plan is in [docs/06-final-firmware.md](../../docs/06-final-firmware.md).

## Status

Not written yet. We build this after the bench test works, so we do not
debug two new things at the same time.

## Starting points

- [Espressif ICD example](https://github.com/espressif/esp-matter/tree/main/examples/icd_app)
- [Espressif sensors example](https://github.com/espressif/esp-matter/tree/main/examples/sensors)
- [ESP-Matter documentation](https://docs.espressif.com/projects/esp-matter/en/latest/esp32/developing.html)
- [homecadia: a measured ESP32-C6 Matter/Thread sensor](https://github.com/vavallee/homecadia)

The homecadia project reports about **125 µA** average on similar hardware.
That is the reference for the battery estimate.

## Build idea

```bash
docker run --rm -it \
  -v "$PWD:/project" \
  -w /project \
  espressif/esp-matter:latest \
  idf.py set-target esp32c6 build
```

The final device talks to Home Assistant through the **ZBT-2 + OTBR**
border router. The setup is in
[docs/14-thread-border-router.md](../../docs/14-thread-border-router.md).
