import type * as THREE from 'three';
import type { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export type Mode = 'assembled' | 'exploded' | 'wiring' | 'print';

export type PartId =
  | 'xiao'
  | 'hat'
  | 'battery'
  | 'box'
  | 'lid'
  | 'shield'
  | 'led'
  | 'reed'
  | 'wires';

export interface Part {
  id: PartId;
  name: string;
  description: string;
  dimensions: string;
  group: THREE.Group;
  explode: THREE.Vector3;
  basePosition: THREE.Vector3;
  materials: THREE.MeshStandardMaterial[];
  labels: CSS2DObject[];
}

export interface Connection {
  id: string;
  label: string;
  detail: string;
  color: number;
  css: string;
  group: 'hat' | 'battery' | 'led' | 'reed' | 'divider';
  partIds: PartId[];
}

export interface Step {
  title: string;
  body: string;
  mode: Mode;
  partIds: PartId[];
  focusId?: PartId;
}

export interface Device {
  root: THREE.Group;
  parts: Part[];
  partById: Map<string, Part>;
  labels: CSS2DObject[];
  dimensions: THREE.Group;
}
