# Enclosure

This folder will hold the 3D-printable files:

- `sun-shield.stl` — the ready-to-print file for your friend
- `sun-shield.step` — the editable 3D model
- `bracket.stl` — pole/fence mount
- `print-settings.md` — material and slicer settings
- `assembly.md` — step-by-step assembly

## Status

Waiting for the exact IP65 box dimensions. The design brief is in
[docs/09-enclosure.md](../docs/09-enclosure.md).

## What the friend needs

Just the STL file. They open it in their slicer (PrusaSlicer, Cura,
Bambu Studio, etc.), choose white PETG or ASA, and print.

Suggested settings:

- 0.2 mm layer height
- 3 walls
- 20-30 % infill
- no supports if possible
- white filament

## Design notes

- 5-6 white plates with 8-10 mm air gaps
- top plate solid, sides open, bottom open
- central space for the electronics box
- mounting bracket for a pole or fence
- parametric so the box size can change
