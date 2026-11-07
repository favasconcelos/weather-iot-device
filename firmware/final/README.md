# Final firmware

This folder will contain the real outdoor firmware:

- ESP-IDF
- Espressif Matter SDK
- Matter over Thread
- ICD / sleepy device
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

## Build idea

```bash
docker run --rm -it \
  -v "$PWD:/project" \
  -w /project \
  espressif/esp-matter:latest \
  idf.py set-target esp32c6 build
```
