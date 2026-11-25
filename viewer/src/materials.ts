import * as THREE from 'three';

/**
 * Shared materials. The selection highlight uses a Box3Helper rather than
 * emissive colours, so sharing materials between parts is safe.
 */
export const MAT = {
  pcbGreen: new THREE.MeshStandardMaterial({
    color: 0x1f6b3f,
    roughness: 0.72,
    metalness: 0.08,
  }),
  pcbBlack: new THREE.MeshStandardMaterial({
    color: 0x16181d,
    roughness: 0.6,
    metalness: 0.1,
  }),
  white: new THREE.MeshStandardMaterial({
    color: 0xf3f4f2,
    roughness: 0.62,
    metalness: 0.02,
  }),
  lid: new THREE.MeshStandardMaterial({
    color: 0xf7f8f6,
    roughness: 0.55,
    metalness: 0.02,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  box: new THREE.MeshStandardMaterial({
    color: 0xf8f9f7,
    roughness: 0.45,
    metalness: 0.02,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: THREE.DoubleSide,
  }),
  shield: new THREE.MeshStandardMaterial({
    color: 0xf7f6ee,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  }),
  gasket: new THREE.MeshStandardMaterial({
    color: 0x2a2f36,
    roughness: 0.92,
    metalness: 0.02,
  }),
  metal: new THREE.MeshStandardMaterial({
    color: 0xb9bec7,
    roughness: 0.32,
    metalness: 0.88,
  }),
  gold: new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.3,
    metalness: 0.9,
  }),
  black: new THREE.MeshStandardMaterial({
    color: 0x14171b,
    roughness: 0.6,
    metalness: 0.15,
  }),
  dark: new THREE.MeshStandardMaterial({
    color: 0x2c333b,
    roughness: 0.78,
    metalness: 0.1,
  }),
  red: new THREE.MeshStandardMaterial({
    color: 0xe53935,
    roughness: 0.42,
    metalness: 0.05,
  }),
  blue: new THREE.MeshStandardMaterial({
    color: 0x1e88e5,
    roughness: 0.42,
    metalness: 0.05,
  }),
  yellow: new THREE.MeshStandardMaterial({
    color: 0xf2cf3a,
    roughness: 0.42,
    metalness: 0.05,
  }),
  green: new THREE.MeshStandardMaterial({
    color: 0x43a047,
    roughness: 0.42,
    metalness: 0.05,
  }),
  purple: new THREE.MeshStandardMaterial({
    color: 0x8e24aa,
    roughness: 0.42,
    metalness: 0.05,
  }),
  orange: new THREE.MeshStandardMaterial({
    color: 0xfb8c00,
    roughness: 0.42,
    metalness: 0.05,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: 0xbfe3ff,
    roughness: 0.12,
    metalness: 0.1,
    transparent: true,
    opacity: 0.55,
  }),
  ledGreen: new THREE.MeshStandardMaterial({
    color: 0x2fbf71,
    emissive: 0x2fbf71,
    emissiveIntensity: 1.4,
    roughness: 0.3,
  }),
  ledRed: new THREE.MeshStandardMaterial({
    color: 0xe53935,
    emissive: 0xe53935,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  }),
  ceramic: new THREE.MeshStandardMaterial({
    color: 0xe9e4d8,
    roughness: 0.5,
    metalness: 0.1,
  }),
} as const;

export const WIRE_MATERIALS: Record<number, THREE.MeshStandardMaterial> = {
  0xe53935: MAT.red,
  0x1e88e5: MAT.blue,
  0xf2cf3a: MAT.yellow,
  0x43a047: MAT.green,
  0x8e24aa: MAT.purple,
  0xfb8c00: MAT.orange,
  0x111318: MAT.black,
};
