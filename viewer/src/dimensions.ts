import * as THREE from 'three';
import { label } from './geometry';

function addLine(
  group: THREE.Group,
  from: [number, number, number],
  to: [number, number, number],
): void {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ]);
  const material = new THREE.LineDashedMaterial({
    color: 0xf5b942,
    dashSize: 2,
    gapSize: 2,
    transparent: true,
    opacity: 0.9,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  group.add(line);
}

function addDimension(
  group: THREE.Group,
  from: [number, number, number],
  to: [number, number, number],
  text: string,
  labelPosition: [number, number, number],
): void {
  addLine(group, from, to);
  const textLabel = label(text, 'dimension-label');
  textLabel.position.set(...labelPosition);
  group.add(textLabel);
}

/**
 * Approximate dimensions in millimetres, drawn at the assembled position.
 * They are most useful with the explode slider at zero.
 */
export function createDimensions(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'dimensions';
  group.visible = false;

  addDimension(group, [-50, 12, 42], [50, 12, 42], '100 mm', [0, 14, 42]);
  addDimension(group, [56, 20, 42], [56, 70, 42], '50 mm', [58, 45, 42]);
  addDimension(group, [56, 12, -34], [56, 12, 34], '68 mm', [58, 14, 0]);

  addDimension(group, [-75, 4, 62], [75, 4, 62], '150 mm', [0, 6, 62]);
  addDimension(group, [82, 10, 62], [82, 90, 62], '80 mm', [84, 50, 62]);
  addDimension(group, [-82, 4, -55], [-82, 4, 55], '110 mm', [-84, 6, 0]);

  return group;
}
