import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { PartId } from './types';

export function roundedBox(
  width: number,
  height: number,
  depth: number,
  radius: number,
  material: THREE.Material,
  segments = 3,
): THREE.Mesh {
  const safeRadius = Math.max(
    0.01,
    Math.min(radius, width / 2 - 0.01, height / 2 - 0.01, depth / 2 - 0.01),
  );
  const geometry = new RoundedBoxGeometry(width, height, depth, segments, safeRadius);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function box(
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cylinder(
  radius: number,
  height: number,
  material: THREE.Material,
  segments = 24,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, segments),
    material,
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * A flat plate with a rectangular hole, built by extruding a 2D shape.
 * The result lies in the XZ plane, with the thickness along Y.
 */
export function plateWithHole(
  width: number,
  depth: number,
  thickness: number,
  holeWidth: number,
  holeDepth: number,
  material: THREE.Material,
): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -depth / 2);
  shape.lineTo(width / 2, -depth / 2);
  shape.lineTo(width / 2, depth / 2);
  shape.lineTo(-width / 2, depth / 2);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-holeWidth / 2, -holeDepth / 2);
  hole.lineTo(-holeWidth / 2, holeDepth / 2);
  hole.lineTo(holeWidth / 2, holeDepth / 2);
  hole.lineTo(holeWidth / 2, -holeDepth / 2);
  hole.closePath();
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -thickness / 2, 0);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function wireTube(
  points: Array<[number, number, number]>,
  material: THREE.Material,
  radius = 0.55,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    'catmullrom',
    0.35,
  );
  const geometry = new THREE.TubeGeometry(curve, 42, radius, 7, false);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

export function label(text: string, className = 'part-label'): CSS2DObject {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = text;
  const object = new CSS2DObject(element);
  object.center.set(0.5, 1);
  return object;
}

/** Outline materials, kept so the theme can recolour them. */
export const EDGE_MATERIALS: THREE.LineBasicMaterial[] = [];

export function addEdges(
  mesh: THREE.Mesh,
  color = 0xa8b5c2,
  opacity = 0.28,
): void {
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  material.userData.base = { color: new THREE.Color(color), opacity };
  EDGE_MATERIALS.push(material);

  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 24), material);
  edges.raycast = () => undefined;
  mesh.add(edges);
}

export function markPart(
  group: THREE.Group,
  id: PartId,
  connectionGroup?: string,
): void {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.userData.partId = id;
      if (connectionGroup) {
        object.userData.connectionGroup = connectionGroup;
      }
    }
  });
}

export function collectMaterials(group: THREE.Object3D): THREE.MeshStandardMaterial[] {
  const materials: THREE.MeshStandardMaterial[] = [];
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }
    const candidates = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of candidates) {
      if (material instanceof THREE.MeshStandardMaterial && !materials.includes(material)) {
        materials.push(material);
      }
    }
  });
  return materials;
}

export function collectLabels(group: THREE.Object3D): CSS2DObject[] {
  const labels: CSS2DObject[] = [];
  group.traverse((object) => {
    if (object instanceof CSS2DObject) {
      labels.push(object);
    }
  });
  return labels;
}

export function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
    }
  });
}
