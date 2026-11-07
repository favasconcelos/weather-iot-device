import * as THREE from 'three';
import {
  addEdges,
  box,
  collectLabels,
  collectMaterials,
  cylinder,
  label,
  markPart,
  plateWithHole,
  roundedBox,
  wireTube,
} from './geometry';
import { MAT } from './materials';
import { createDimensions } from './dimensions';
import type { Connection, Device, Part, PartId, Step } from './types';

const BOX = { w: 100, h: 50, d: 68 };
const SHIELD = { w: 150, d: 110, holeW: 110, holeD: 78, count: 6, y0: 10, gap: 16 };
const XIAO_POS: [number, number, number] = [-27, 40, 12];
const SHT40_POS: [number, number, number] = [25, 32, 0];
const BATTERY_POS: [number, number, number] = [-5, 28, -21];
const LED_POS: [number, number, number] = [45, 45, 34];
const REED_POS: [number, number, number] = [-45, 45, 34];

function part(
  id: PartId,
  name: string,
  description: string,
  dimensions: string,
  group: THREE.Group,
  explode: [number, number, number],
): Part {
  markPart(group, id);
  return {
    id,
    name,
    description,
    dimensions,
    group,
    explode: new THREE.Vector3(...explode),
    basePosition: group.position.clone(),
    materials: collectMaterials(group),
    labels: collectLabels(group),
  };
}

function buildBox(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, 20, 0);

  const bottom = box(BOX.w, 2, BOX.d, MAT.box);
  bottom.position.set(0, 1, 0);
  bottom.raycast = () => undefined;
  addEdges(bottom, 0x5c6772, 0.46);
  group.add(bottom);

  const front = box(BOX.w, BOX.h, 2, MAT.box);
  front.position.set(0, BOX.h / 2, BOX.d / 2 - 1);
  front.raycast = () => undefined;
  addEdges(front, 0x5c6772, 0.36);
  group.add(front);

  const back = box(BOX.w, BOX.h, 2, MAT.box);
  back.position.set(0, BOX.h / 2, -BOX.d / 2 + 1);
  back.raycast = () => undefined;
  addEdges(back, 0x5c6772, 0.36);
  group.add(back);

  const left = box(2, BOX.h, BOX.d, MAT.box);
  left.position.set(-BOX.w / 2 + 1, BOX.h / 2, 0);
  left.raycast = () => undefined;
  addEdges(left, 0x5c6772, 0.36);
  group.add(left);

  const right = box(2, BOX.h, BOX.d, MAT.box);
  right.position.set(BOX.w / 2 - 1, BOX.h / 2, 0);
  right.raycast = () => undefined;
  addEdges(right, 0x5c6772, 0.36);
  group.add(right);

  // Gore vent on the bottom face, under the sensor.
  const ventRing = cylinder(6.5, 2, MAT.dark, 24);
  ventRing.position.set(25, -0.5, 0);
  group.add(ventRing);
  const ventBody = cylinder(5.6, 4, MAT.metal, 24);
  ventBody.position.set(25, -2.5, 0);
  group.add(ventBody);
  const membrane = cylinder(5.1, 0.5, MAT.white, 24);
  membrane.position.set(25, -4.6, 0);
  group.add(membrane);

  const ventLabel = label('Gore vent (bottom)', 'part-label');
  ventLabel.position.set(25, -8, 0);
  group.add(ventLabel);

  const boxLabel = label('IP65 box', 'part-label');
  boxLabel.position.set(0, 30, 40);
  group.add(boxLabel);

  return group;
}

function buildLid(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, 50, 0);

  const lid = roundedBox(BOX.w, 3, BOX.d, 2, MAT.lid);
  lid.position.set(0, 1.5, 0);
  lid.raycast = () => undefined;
  addEdges(lid, 0x4f5b66, 0.5);
  group.add(lid);

  const gasket = plateWithHole(96, 64, 1, 90, 58, MAT.gasket);
  gasket.position.set(0, -0.6, 0);
  group.add(gasket);

  for (const x of [-45, 45]) {
    for (const z of [-30, 30]) {
      const screw = cylinder(1.7, 4, MAT.metal, 16);
      screw.position.set(x, 3.8, z);
      group.add(screw);
      const slot = box(2.2, 0.35, 0.7, MAT.dark);
      slot.position.set(x, 5.9, z);
      slot.rotation.y = Math.PI / 4;
      group.add(slot);
    }
  }

  const lidLabel = label('Lid + gasket', 'part-label');
  lidLabel.position.set(0, 9, 26);
  group.add(lidLabel);

  return group;
}

function buildShield(): THREE.Group {
  const group = new THREE.Group();

  const plateGroups: THREE.Group[] = [];
  for (let index = 0; index < SHIELD.count; index += 1) {
    const y = SHIELD.y0 + index * SHIELD.gap;
    const isTop = index === SHIELD.count - 1;
    const plate = isTop
      ? roundedBox(SHIELD.w, 3, SHIELD.d, 2.5, MAT.shield)
      : plateWithHole(SHIELD.w, SHIELD.d, 3, SHIELD.holeW, SHIELD.holeD, MAT.shield);
    plate.position.set(0, y, 0);
    addEdges(plate, 0x8b8578, 0.28);

    const plateGroup = new THREE.Group();
    plateGroup.userData.plateIndex = index;
    plateGroup.add(plate);
    group.add(plateGroup);
    plateGroups.push(plateGroup);
  }
  group.userData.plates = plateGroups;

  for (const x of [-65, 65]) {
    for (const z of [-45, 45]) {
      const spacer = cylinder(4, 80, MAT.metal, 18);
      spacer.position.set(x, 50, z);
      group.add(spacer);

      const screw = cylinder(5, 2, MAT.metal, 18);
      screw.position.set(x, 91, z);
      group.add(screw);

      const foot = cylinder(5, 10, MAT.dark, 18);
      foot.position.set(x, 5, z);
      group.add(foot);
    }
  }

  for (const x of [-45, 45]) {
    for (const z of [-30, 30]) {
      const post = cylinder(3, 10, MAT.dark, 14);
      post.position.set(x, 15, z);
      group.add(post);
    }
  }

  const shieldLabel = label('Radiation shield · 3D printed', 'part-label accent');
  shieldLabel.position.set(0, 101, 0);
  group.add(shieldLabel);

  return group;
}

function buildXiao(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...XIAO_POS);

  const board = roundedBox(21, 1.6, 17.8, 0.7, MAT.pcbGreen);
  group.add(board);

  const usb = roundedBox(9, 2.8, 7.5, 0.6, MAT.metal);
  usb.position.set(-10.9, 0.9, 0);
  group.add(usb);

  const usbSlot = box(6, 1.2, 5.4, MAT.black);
  usbSlot.position.set(-11.6, 1.25, 0);
  group.add(usbSlot);

  const shieldCan = roundedBox(12, 2, 10, 0.4, MAT.metal);
  shieldCan.position.set(0.4, 1.7, -1);
  group.add(shieldCan);

  const antenna = box(3.2, 1.1, 6, MAT.ceramic);
  antenna.position.set(8.8, 1.05, 0);
  group.add(antenna);

  const antennaLine = box(0.4, 0.12, 5, MAT.gold);
  antennaLine.position.set(8.8, 1.65, 0);
  group.add(antennaLine);

  for (let i = 0; i < 7; i += 1) {
    const x = -7.6 + i * 2.53;
    for (const z of [-8.7, 8.7]) {
      const pin = box(0.64, 2.6, 0.64, MAT.gold);
      pin.position.set(x, 2.15, z);
      group.add(pin);
      const base = box(1.05, 0.9, 1.05, MAT.black);
      base.position.set(x, 0.85, z);
      group.add(base);
    }
  }

  for (const [x, z] of [
    [-7, 5.4],
    [2.5, 5.4],
  ] as Array<[number, number]>) {
    const button = roundedBox(1.8, 0.7, 1.8, 0.2, MAT.black);
    button.position.set(x, 1.1, z);
    group.add(button);
  }

  const xiaoLabel = label('XIAO ESP32-C6', 'part-label');
  xiaoLabel.position.set(0, 9, 0);
  group.add(xiaoLabel);

  return group;
}

function buildSht40(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...SHT40_POS);

  const board = roundedBox(25.4, 1.6, 17.8, 0.7, MAT.pcbPurple);
  group.add(board);

  const sensor = roundedBox(1.6, 1.0, 1.6, 0.15, MAT.white);
  sensor.position.set(0, 1.2, 0);
  group.add(sensor);

  const window = box(0.9, 0.08, 0.9, MAT.dark);
  window.position.set(0, 1.73, 0);
  group.add(window);

  for (let i = 0; i < 4; i += 1) {
    const z = -6 + i * 4;
    const pin = cylinder(0.45, 2.2, MAT.gold, 12);
    pin.position.set(-11.5, 1.2, z);
    group.add(pin);
  }
  const headerBase = box(4.2, 1.0, 1.6, MAT.black);
  headerBase.position.set(-11.5, 0.9, -6);
  group.add(headerBase);
  for (let i = 1; i < 4; i += 1) {
    const base = headerBase.clone();
    base.position.z = -6 + i * 4;
    group.add(base);
  }

  const regulator = box(3, 1.1, 3, MAT.black);
  regulator.position.set(7.5, 1.2, -5.5);
  group.add(regulator);

  const levelShifter = box(3, 1.1, 2.4, MAT.black);
  levelShifter.position.set(7.5, 1.2, 5.5);
  group.add(levelShifter);

  const shtLabel = label('SHT40 sensor', 'part-label');
  shtLabel.position.set(0, 8, 0);
  group.add(shtLabel);

  return group;
}

function buildBattery(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...BATTERY_POS);

  const base = roundedBox(77, 3, 21, 2, MAT.black);
  base.position.set(0, 1.5, 0);
  group.add(base);

  for (const x of [-38.5, 38.5]) {
    const cap = roundedBox(5, 15, 21, 1.2, MAT.black);
    cap.position.set(x, 7.5, 0);
    group.add(cap);
  }

  const cell = cylinder(9.2, 65, MAT.cell, 32);
  cell.rotation.z = Math.PI / 2;
  cell.position.set(0, 9.2, 0);
  group.add(cell);

  const band = cylinder(9.28, 12, MAT.white, 32);
  band.rotation.z = Math.PI / 2;
  band.position.set(0, 9.2, 0);
  group.add(band);

  const positive = cylinder(4, 1.5, MAT.gold, 20);
  positive.rotation.z = Math.PI / 2;
  positive.position.set(33, 9.2, 0);
  group.add(positive);

  const negative = cylinder(4, 1.0, MAT.metal, 20);
  negative.rotation.z = Math.PI / 2;
  negative.position.set(-33, 9.2, 0);
  group.add(negative);

  const batteryLabel = label('18650 + holder', 'part-label');
  batteryLabel.position.set(0, 22, 0);
  group.add(batteryLabel);

  return group;
}

function buildLed(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...LED_POS);

  const pipe = cylinder(1.8, 8, MAT.glass, 20);
  pipe.rotation.x = Math.PI / 2;
  group.add(pipe);

  const head = cylinder(1.7, 2.4, MAT.glass, 20);
  head.rotation.x = Math.PI / 2;
  head.position.set(0, 0, 4.4);
  group.add(head);

  const core = cylinder(1.1, 0.6, MAT.ledGreen, 20);
  core.rotation.x = Math.PI / 2;
  core.position.set(0, 0, 5.0);
  group.add(core);

  const band = cylinder(1.25, 0.35, MAT.ledRed, 20);
  band.rotation.x = Math.PI / 2;
  band.position.set(0, 0, 4.55);
  group.add(band);

  for (const [x, z] of [
    [-3.2, -3.5],
    [2.6, -3.5],
  ] as Array<[number, number]>) {
    const resistor = cylinder(0.9, 3.4, MAT.dark, 12);
    resistor.rotation.z = Math.PI / 2;
    resistor.position.set(x, -1.8, z);
    group.add(resistor);
    const stripe = cylinder(0.95, 0.5, MAT.ceramic, 12);
    stripe.rotation.z = Math.PI / 2;
    stripe.position.set(x + 0.7, -1.8, z);
    group.add(stripe);
  }

  const ledLabel = label('LED + resistors', 'part-label');
  ledLabel.position.set(0, 6, 9);
  group.add(ledLabel);

  return group;
}

function buildReed(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...REED_POS);

  const tube = cylinder(1.2, 10, MAT.glass, 16);
  tube.rotation.z = Math.PI / 2;
  group.add(tube);

  for (const x of [-2.6, 2.6]) {
    const reed = box(3.6, 0.35, 0.35, MAT.metal);
    reed.position.set(x, 0, 0);
    group.add(reed);
  }

  const magnet = new THREE.Group();
  magnet.position.set(0, 0, 10);
  const north = roundedBox(4, 8, 4, 0.8, MAT.red);
  north.position.set(2, 0, 0);
  magnet.add(north);
  const south = roundedBox(4, 8, 4, 0.8, MAT.blue);
  south.position.set(-2, 0, 0);
  magnet.add(south);
  group.add(magnet);

  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(1.4, 3, 12),
    MAT.yellow,
  );
  arrow.position.set(0, 0, 5.6);
  arrow.rotation.x = -Math.PI / 2;
  group.add(arrow);

  const reedLabel = label('Reed switch + magnet', 'part-label');
  reedLabel.position.set(0, 7, 8);
  group.add(reedLabel);

  return group;
}

function addWire(
  parent: THREE.Group,
  points: Array<[number, number, number]>,
  material: THREE.Material,
  connectionGroup: string,
  radius = 0.55,
): THREE.Mesh {
  const mesh = wireTube(points, material, radius);
  mesh.userData.connectionGroup = connectionGroup;
  parent.add(mesh);
  return mesh;
}

function buildWires(): THREE.Group {
  const group = new THREE.Group();

  // SHT40: 3V3, GND, SDA, SCL. The wires leave the -Z side of the XIAO.
  addWire(
    group,
    [
      [-34.6, 41.2, 3.3],
      [-33, 46, 5],
      [-20, 50, 8],
      [0, 50, 4],
      [10, 40, -3],
      [13.5, 31.8, -6],
    ],
    MAT.red,
    'sensor-3v3',
  );
  addWire(
    group,
    [
      [-32.05, 41.2, 3.3],
      [-30, 45, 1],
      [-15, 49, 1],
      [0, 50, 2],
      [10, 38, 0],
      [13.5, 31.8, -2],
    ],
    MAT.black,
    'sensor-gnd',
  );
  addWire(
    group,
    [
      [-29.5, 41.2, 3.3],
      [-27, 44.5, -1],
      [-10, 48, -1],
      [2, 49, 3],
      [9, 39, 2],
      [13.5, 31.8, 2],
    ],
    MAT.blue,
    'sensor-sda',
  );
  addWire(
    group,
    [
      [-26.9, 41.2, 3.3],
      [-24, 44, 1],
      [-8, 47, 1],
      [2, 48, 5],
      [9, 38, 6],
      [13.5, 31.8, 6],
    ],
    MAT.yellow,
    'sensor-scl',
  );

  // Battery: positive through the fuse, negative back to the XIAO.
  addWire(
    group,
    [
      [27.5, 37.2, -21],
      [24, 42, -17],
      [10, 46, -13],
      [0, 46, -7],
      [-20, 42, -2],
      [-33, 39.5, 1],
    ],
    MAT.red,
    'battery-positive',
    0.72,
  );
  addWire(
    group,
    [
      [-37.5, 37.2, -21],
      [-40, 42, -15],
      [-38, 45, -5],
      [-34, 42, 0],
      [-33, 39.5, 1],
    ],
    MAT.black,
    'battery-negative',
    0.72,
  );

  const fuse = cylinder(2.1, 9, MAT.dark, 16);
  fuse.rotation.z = Math.PI / 2;
  fuse.position.set(10, 46, -13);
  fuse.userData.connectionGroup = 'battery-positive';
  group.add(fuse);
  const fuseBand = cylinder(2.2, 1.2, MAT.metal, 16);
  fuseBand.rotation.z = Math.PI / 2;
  fuseBand.position.set(10, 46, -13);
  fuseBand.userData.connectionGroup = 'battery-positive';
  group.add(fuseBand);
  const fuseLabel = label('1 A fuse', 'part-label');
  fuseLabel.position.set(10, 51, -13);
  fuseLabel.userData.connectionGroup = 'battery-positive';
  group.add(fuseLabel);

  // LED wires, from the +Z side of the XIAO to the front wall.
  addWire(
    group,
    [
      [-19.4, 41.2, 20.7],
      [-16, 46, 23],
      [0, 48, 28],
      [20, 48, 31],
      [38, 47, 32],
      [43, 45.5, 32],
    ],
    MAT.green,
    'led-signal',
    0.42,
  );
  addWire(
    group,
    [
      [-21.9, 41.2, 20.7],
      [-18, 45, 22],
      [2, 47, 27],
      [22, 47, 30],
      [38, 46, 31],
      [43, 44.5, 32],
    ],
    MAT.red,
    'led-signal',
    0.42,
  );

  // Reed switch wires, also from the +Z side.
  addWire(
    group,
    [
      [-34.6, 41.2, 20.7],
      [-39, 46, 24],
      [-46, 48, 28],
      [-48, 47, 31],
      [-45, 45.5, 32],
    ],
    MAT.purple,
    'reed-signal',
    0.42,
  );
  addWire(
    group,
    [
      [-32.05, 41.2, 20.7],
      [-37, 45, 22],
      [-44, 47, 27],
      [-46, 46, 30],
      [-45, 44.5, 32],
    ],
    MAT.black,
    'reed-signal',
    0.42,
  );

  // Battery voltage divider, thin orange wire to A0.
  addWire(
    group,
    [
      [24, 40, -17],
      [20, 46, -9],
      [0, 48, 1],
      [-20, 46, 8],
      [-30, 42, 6],
      [-33, 40, 3.3],
    ],
    MAT.orange,
    'battery-divider',
    0.34,
  );

  // Group the wires so the UI can show or hide one connection at a time.
  const subgroups = new Map<string, THREE.Group>();
  for (const child of [...group.children]) {
    if (child.userData.connectionGroup) {
      const key = child.userData.connectionGroup as string;
      let subgroup = subgroups.get(key);
      if (!subgroup) {
        subgroup = new THREE.Group();
        subgroup.name = `wires-${key}`;
        subgroup.userData.connectionGroup = key;
        subgroups.set(key, subgroup);
        group.add(subgroup);
      }
      subgroup.attach(child);
    }
  }

  return group;
}
export function createDevice(): Device {
  const root = new THREE.Group();
  root.name = 'window-weather-sensor';

  const boxGroup = buildBox();
  const lidGroup = buildLid();
  const shieldGroup = buildShield();
  const xiaoGroup = buildXiao();
  const sht40Group = buildSht40();
  const batteryGroup = buildBattery();
  const ledGroup = buildLed();
  const reedGroup = buildReed();
  const wiresGroup = buildWires();

  root.add(boxGroup, lidGroup, shieldGroup, xiaoGroup, sht40Group, batteryGroup, ledGroup, reedGroup, wiresGroup);

  const parts: Part[] = [
    part(
      'shield',
      'Radiation shield',
      '3D-printed white shield. Six plates with air gaps block direct sun and let air flow around the sensor. This is the part your friend prints.',
      'About 150 × 110 × 80 mm',
      shieldGroup,
      [0, 55, 0],
    ),
    part(
      'box',
      'IP65 box',
      'White weatherproof box. Holds the XIAO, battery, and sensor. The sensor sits near the bottom Gore vent; the lid has a silicone gasket.',
      'About 100 × 68 × 50 mm',
      boxGroup,
      [0, 0, 0],
    ),
    part(
      'lid',
      'Lid + gasket',
      'Screw-on lid with a silicone gasket and four stainless screws. The gasket is the main defence against rain.',
      '100 × 68 × 3 mm + gasket',
      lidGroup,
      [0, 32, 0],
    ),
    part(
      'xiao',
      'XIAO ESP32-C6',
      'The brain. ESP32-C6 with Wi-Fi, Thread, Bluetooth, USB-C, and a Li-ion charger. 3.3 V logic. This is the board that runs the Matter firmware.',
      '21 × 17.8 mm',
      xiaoGroup,
      [-12, 64, -8],
    ),
    part(
      'sht40',
      'SHT40 sensor',
      'Temperature and humidity sensor. I2C address 0x44. About ±0.2 °C and ±1.8 % RH. Powered from 3.3 V.',
      '25.4 × 17.8 mm breakout',
      sht40Group,
      [12, 60, 8],
    ),
    part(
      'battery',
      '18650 + holder',
      'Protected 18650 Li-ion cell, 3.7 V, about 3400 mAh. The XIAO charges it over USB-C. A 1 A fuse is in the positive lead.',
      '18 × 65 mm cell',
      batteryGroup,
      [-8, 68, -30],
    ),
    part(
      'led',
      'LED + resistors',
      'Bi-colour red/green LED behind a light pipe. Off in normal operation. Patterns show boot, pairing, connected, error, and low battery.',
      '3 mm LED + 2 resistors',
      ledGroup,
      [15, 63, 20],
    ),
    part(
      'reed',
      'Reed switch + magnet',
      'Reed switch inside the box; a magnet from outside triggers status and factory reset. No button hole, so no extra leak point.',
      '10 mm reed switch + magnet',
      reedGroup,
      [-15, 63, 20],
    ),
    part(
      'wires',
      'Wires',
      'Colour-coded connections between the XIAO, sensor, battery, LED, and reed switch. Click a connection in the list to highlight it.',
      '4 signal wires + power wires',
      wiresGroup,
      [0, 0, 0],
    ),
  ];

  const order: PartId[] = [
    'xiao',
    'sht40',
    'battery',
    'led',
    'reed',
    'wires',
    'box',
    'lid',
    'shield',
  ];
  parts.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  const partById = new Map(parts.map((entry) => [entry.id, entry]));
  const labels = parts.flatMap((entry) => entry.labels);

  const dimensions = createDimensions();
  root.add(dimensions);

  return { root, parts, partById, labels, dimensions };
}

export const CONNECTIONS: Connection[] = [
  {
    id: 'sensor-3v3',
    label: 'XIAO 3V3 → SHT40 VIN',
    detail: '3.3 V power for the sensor. Red wire.',
    color: 0xe53935,
    css: '#e53935',
    group: 'sensor-3v3',
    partIds: ['xiao', 'sht40'],
  },
  {
    id: 'sensor-gnd',
    label: 'XIAO GND → SHT40 GND',
    detail: 'Common ground. Black wire.',
    color: 0x111318,
    css: '#5c6670',
    group: 'sensor-gnd',
    partIds: ['xiao', 'sht40'],
  },
  {
    id: 'sensor-sda',
    label: 'D4 / GPIO22 → SHT40 SDA',
    detail: 'I2C data. Blue wire.',
    color: 0x1e88e5,
    css: '#1e88e5',
    group: 'sensor-sda',
    partIds: ['xiao', 'sht40'],
  },
  {
    id: 'sensor-scl',
    label: 'D5 / GPIO23 → SHT40 SCL',
    detail: 'I2C clock. Yellow wire.',
    color: 0xf2cf3a,
    css: '#fdd835',
    group: 'sensor-scl',
    partIds: ['xiao', 'sht40'],
  },
  {
    id: 'battery-positive',
    label: 'Battery + → fuse → XIAO BAT+',
    detail: 'Protected 18650 positive, through a 1 A fuse.',
    color: 0xe53935,
    css: '#e53935',
    group: 'battery-positive',
    partIds: ['battery', 'xiao'],
  },
  {
    id: 'battery-negative',
    label: 'Battery − → XIAO BAT−',
    detail: 'Battery negative return. Black wire.',
    color: 0x111318,
    css: '#5c6670',
    group: 'battery-negative',
    partIds: ['battery', 'xiao'],
  },
  {
    id: 'led-signal',
    label: 'XIAO GPIO → LED',
    detail: 'Two wires through the current-limiting resistors. Green/red LED.',
    color: 0x43a047,
    css: '#43a047',
    group: 'led-signal',
    partIds: ['xiao', 'led'],
  },
  {
    id: 'reed-signal',
    label: 'XIAO GPIO → reed switch',
    detail: 'Magnet-triggered status and factory reset. Purple wire.',
    color: 0x8e24aa,
    css: '#8e24aa',
    group: 'reed-signal',
    partIds: ['xiao', 'reed'],
  },
  {
    id: 'battery-divider',
    label: 'Battery + → 1 MΩ / 1 MΩ → A0',
    detail: 'Voltage divider for battery percentage. Orange wire.',
    color: 0xfb8c00,
    css: '#fb8c00',
    group: 'battery-divider',
    partIds: ['battery', 'xiao'],
  },
];

export const STEPS: Step[] = [
  {
    title: 'Solder headers to the XIAO',
    body: 'Solder the two rows of pin headers. Check for bridges between pins before powering up.',
    mode: 'assembled',
    partIds: ['xiao'],
    focusId: 'xiao',
  },
  {
    title: 'Solder wires to the SHT40',
    body: 'Solder four wires to VIN, GND, SDA, and SCL. Use red, black, blue, and yellow so you cannot mix them up.',
    mode: 'assembled',
    partIds: ['sht40'],
    focusId: 'sht40',
  },
  {
    title: 'Wire the sensor and run the bench test',
    body: 'Connect 3V3, GND, SDA, and SCL. Power from USB and check the readings in Home Assistant before going further.',
    mode: 'wiring',
    partIds: ['xiao', 'sht40', 'wires'],
    focusId: 'wires',
  },
  {
    title: 'Add the battery and fuse',
    body: 'Fit the 18650 holder, add the 1 A fuse in the positive lead, and solder the battery wires to the XIAO BAT pads.',
    mode: 'wiring',
    partIds: ['battery', 'xiao', 'wires'],
    focusId: 'battery',
  },
  {
    title: 'Add the LED and reed switch',
    body: 'Solder the LED with its resistors and the reed switch. The magnet goes outside the box, near the marked spot.',
    mode: 'wiring',
    partIds: ['led', 'reed', 'xiao', 'wires'],
    focusId: 'led',
  },
  {
    title: 'Test the low-power firmware',
    body: 'Flash the final firmware, check that it sleeps and reports every 1-2 hours, then measure the battery current. Do not close the box yet.',
    mode: 'assembled',
    partIds: ['xiao', 'battery'],
    focusId: 'box',
  },
  {
    title: 'Mount the electronics in the box',
    body: 'Put the sensor over the Gore vent at the bottom. Keep the XIAO and battery at the top. Add a small desiccant pack.',
    mode: 'wiring',
    partIds: ['box', 'xiao', 'sht40', 'battery'],
    focusId: 'box',
  },
  {
    title: 'Close the lid',
    body: 'Check the gasket, close the lid, and tighten the four screws evenly. Do the paper-towel water test before the real electronics go in.',
    mode: 'exploded',
    partIds: ['box', 'lid'],
    focusId: 'lid',
  },
  {
    title: 'Slide the box into the shield',
    body: 'The box sits inside the central opening of the printed radiation shield. Keep the antenna away from the metal spacers.',
    mode: 'exploded',
    partIds: ['box', 'shield'],
    focusId: 'shield',
  },
  {
    title: 'Mount on the window',
    body: 'Outside the glass, 10–15 cm from the wall, shaded from direct sun. Cable entry down. Check the Thread signal and the first 24 hours of readings.',
    mode: 'assembled',
    partIds: ['shield', 'box'],
    focusId: 'shield',
  },
];
