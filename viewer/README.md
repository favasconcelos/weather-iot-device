# 3D prototype viewer

An interactive Three.js model of the office-window weather sensor. It is here
to help you understand the parts, how they fit together, the wiring, and the
assembly order.

This is a **concept model**, not a manufacturing CAD file. Dimensions are
approximate. The real STL/STEP files for the printed shield will be added
later, after the box is measured.

![Assembled weather sensor](screenshot-assembled.png)

## Run it

```bash
cd viewer
npm install
npm run dev
```

Open <http://127.0.0.1:5173/>.

Production build:

```bash
npm run build
npm run preview
```

The build output is `viewer/dist/`. Three.js and the two typefaces are
bundled; no CDN or network request is needed at runtime.

## Controls

- **Drag** to rotate.
- **Scroll** to zoom.
- **Right-drag** to pan.
- **Click a part** in the 3D view or in the Parts list to select it.
- **Click a connection** to isolate those wires.
- **Click an assembly step** to move to the relevant view.
- **Escape** closes the details panel or clears the current selection.
- On a phone or tablet, **Details** opens the parts, wiring and assembly lists.

## The four views

| View | What it shows |
|---|---|
| **Assembled** | The finished device: box, lid, and radiation shield |
| **Exploded** | The lid and electronics lifted out, so you can see the internal order |
| **Wiring** | The box in x-ray mode, with the colour-coded wires |
| **Printed shield** | The 3D-printed radiation shield, fanned out to show its shape |

The **Explode** slider moves between assembled and exploded. The layer toggles
turn the shield, lid, wires, labels, and dimensions on or off. Selecting an
internal part in the assembled view switches to Wiring so the enclosure does
not hide it.

## Screenshots

### Assembled

![Assembled view](screenshot-assembled.png)

### Wiring

![Wiring view](screenshot-wiring.png)

### Connection highlight

![SDA connection isolated](screenshot-connection.png)

### Exploded

![Exploded view](screenshot-exploded.png)

### Printed shield

![Printed shield view](screenshot-print.png)

## What is modelled

- Seeed XIAO ESP32-C6, with USB-C, shield can, antenna area, and pin headers
- SHT40 breakout with the sensor, header, regulator, and level shifter
- Protected 18650 cell in a holder
- IP65 box, lid, gasket, screws, and Gore vent
- Six-plate radiation shield with spacers and feet
- Bi-colour LED, resistors, reed switch, and magnet
- Colour-coded wires:
  - red: 3V3 / battery positive
  - black: GND / battery negative
  - blue: SDA
  - yellow: SCL
  - green: LED
  - purple: reed switch
  - orange: battery voltage divider

## What is simplified

- The PCB traces, exact connector shapes, and component footprints are
  simplified.
- The XIAO and SHT40 are represented by their board outlines and main
  components; the model is not a mechanical drawing.
- The box is a generic 100 × 68 × 50 mm IP65 enclosure.
- The shield is an early concept: six 150 × 110 mm plates with a central
  110 × 78 mm opening. The final dimensions depend on the box you buy.
- The lid and box are shown semi-transparent so you can see inside. The real
  parts are opaque white.

## Source layout

```
viewer/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── screenshot-*.png
└── src/
    ├── assets/
    │   └── fonts/     Instrument Sans and DM Mono (self-hosted)
    ├── main.ts        scene, UI, interactions
    ├── parts.ts       geometry and part descriptions
    ├── dimensions.ts  dimension lines
    ├── geometry.ts    reusable geometry helpers
    ├── materials.ts   colours and materials
    ├── styles.css     UI styling
    └── types.ts       shared types
```
