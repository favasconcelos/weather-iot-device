import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONNECTIONS, createDevice, STEPS } from './parts';
import { MAT } from './materials';
import type { Connection, Mode, Part, Step } from './types';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Missing #app container');
}

const panel = document.querySelector<HTMLElement>('#panel')!;
const panelToggle = document.querySelector<HTMLButtonElement>('#panel-toggle')!;
const resetButton = document.querySelector<HTMLButtonElement>('#reset-view')!;
const partCard = document.querySelector<HTMLElement>('#part-card')!;
const partCardKind = document.querySelector<HTMLElement>('#part-card-kind')!;
const partCardTitle = document.querySelector<HTMLElement>('#part-card-title')!;
const partCardBody = document.querySelector<HTMLElement>('#part-card-body')!;
const partList = document.querySelector<HTMLUListElement>('#part-list')!;
const connectionList = document.querySelector<HTMLUListElement>('#connection-list')!;
const stepList = document.querySelector<HTMLOListElement>('#step-list')!;
const explodeInput = document.querySelector<HTMLInputElement>('#explode')!;
const explodeValue = document.querySelector<HTMLOutputElement>('#explode-value')!;
const toggleShield = document.querySelector<HTMLInputElement>('#toggle-shield')!;
const toggleLid = document.querySelector<HTMLInputElement>('#toggle-lid')!;
const toggleWires = document.querySelector<HTMLInputElement>('#toggle-wires')!;
const toggleLabels = document.querySelector<HTMLInputElement>('#toggle-labels')!;
const toggleDimensions = document.querySelector<HTMLInputElement>('#toggle-dimensions')!;
const loading = document.querySelector<HTMLElement>('#loading')!;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080c11);
scene.fog = new THREE.Fog(0x080c11, 620, 1100);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.set(150, 118, 188);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
app.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 45, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.minDistance = 90;
controls.maxDistance = 760;
controls.maxPolarAngle = Math.PI * 0.54;
controls.update();

scene.add(new THREE.HemisphereLight(0xd9efff, 0x0a1118, 1.15));

const keyLight = new THREE.DirectionalLight(0xfff2dd, 2.35);
keyLight.position.set(145, 230, 165);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 10;
keyLight.shadow.camera.far = 700;
keyLight.shadow.camera.left = -230;
keyLight.shadow.camera.right = 230;
keyLight.shadow.camera.top = 230;
keyLight.shadow.camera.bottom = -230;
keyLight.shadow.bias = -0.0004;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x86b7ff, 0.85);
fillLight.position.set(-170, 95, -150);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x4dd0a8, 0.35);
rimLight.position.set(-30, 120, -220);
scene.add(rimLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(340, 64),
  new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.32 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.35;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(680, 68, 0x1d2b36, 0x111b23);
grid.position.y = -0.25;
const gridMaterial = grid.material as THREE.Material;
gridMaterial.transparent = true;
gridMaterial.opacity = 0.48;
scene.add(grid);

const device = createDevice();
scene.add(device.root);

const clickableMeshes: THREE.Mesh[] = [];
device.root.traverse((object) => {
  if (object instanceof THREE.Mesh && object.userData.partId) {
    clickableMeshes.push(object);
  }
});

const selectionBox = new THREE.Box3Helper(new THREE.Box3(), 0x4dd0a8);
selectionBox.visible = false;
scene.add(selectionBox);

const hoverBox = new THREE.Box3Helper(new THREE.Box3(), 0x9ad7ff);
hoverBox.visible = false;
scene.add(hoverBox);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

interface CameraTween {
  fromPosition: THREE.Vector3;
  toPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  t: number;
}

interface ViewState {
  mode: Mode;
  selected: Part | null;
  hovered: Part | null;
  activeConnection: string | null;
  showShield: boolean;
  showLid: boolean;
  showWires: boolean;
  showLabels: boolean;
  showDimensions: boolean;
  explode: number;
  explodeTarget: number;
}

const state: ViewState = {
  mode: 'wiring',
  selected: null,
  hovered: null,
  activeConnection: null,
  showShield: false,
  showLid: false,
  showWires: true,
  showLabels: false,
  showDimensions: false,
  explode: 0,
  explodeTarget: 0,
};

const electronics = new Set(['xiao', 'sht40', 'battery', 'led', 'reed', 'wires']);
let cameraTween: CameraTween | null = null;
let activeStepElement: HTMLLIElement | null = null;
let pointerDown = { x: 0, y: 0 };

const partButtons = new Map<string, HTMLButtonElement>();
const connectionButtons = new Map<string, HTMLButtonElement>();

function buildUi(): void {
  for (const part of device.parts) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.partId = part.id;
    button.innerHTML = `<span class="dot"></span><span>${part.name}</span>`;
    button.title = part.dimensions;
    button.addEventListener('click', () => selectPart(part, true));
    item.appendChild(button);
    partList.appendChild(item);
    partButtons.set(part.id, button);
  }

  for (const connection of CONNECTIONS) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.connectionId = connection.id;
    button.innerHTML = `<span class="chip" style="background:${connection.css}"></span><span>${connection.label}</span>`;
    button.title = connection.detail;
    button.addEventListener('click', () => activateConnection(connection));
    item.appendChild(button);
    connectionList.appendChild(item);
    connectionButtons.set(connection.id, button);
  }

  for (const [index, step] of STEPS.entries()) {
    const item = document.createElement('li');
    item.textContent = step.title;
    item.title = step.body;
    item.dataset.stepIndex = String(index);
    item.addEventListener('click', () => runStep(step, item));
    stepList.appendChild(item);
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>('.mode-row button')) {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode as Mode | undefined;
      if (mode) {
        setMode(mode);
      }
    });
  }

  toggleShield.addEventListener('change', () => {
    state.showShield = toggleShield.checked;
    applyVisibility();
  });

  toggleLid.addEventListener('change', () => {
    state.showLid = toggleLid.checked;
    applyVisibility();
  });

  toggleWires.addEventListener('change', () => {
    state.showWires = toggleWires.checked;
    if (state.showWires && state.explodeTarget > 0.05) {
      setExplodeTarget(0);
    }
    applyVisibility();
  });

  toggleLabels.addEventListener('change', () => {
    state.showLabels = toggleLabels.checked;
    applyVisibility();
  });

  toggleDimensions.addEventListener('change', () => {
    state.showDimensions = toggleDimensions.checked;
    if (state.showDimensions && state.explodeTarget > 0.05) {
      setExplodeTarget(0);
    }
    applyVisibility();
  });

  explodeInput.addEventListener('input', () => {
    setExplodeTarget(Number(explodeInput.value));
  });

  resetButton.addEventListener('click', resetView);

  panelToggle.addEventListener('click', () => {
    const hidden = panel.classList.toggle('hidden');
    panelToggle.setAttribute('aria-expanded', String(!hidden));
  });
}

function syncControls(): void {
  toggleShield.checked = state.showShield;
  toggleLid.checked = state.showLid;
  toggleWires.checked = state.showWires;
  toggleLabels.checked = state.showLabels;
  toggleDimensions.checked = state.showDimensions;
  explodeInput.value = String(state.explodeTarget);
  explodeValue.textContent = `${Math.round(state.explodeTarget * 100)}%`;
}

function applyVisibility(): void {
  for (const part of device.parts) {
    part.group.visible = !(state.mode === 'print' && electronics.has(part.id));
  }

  applyShieldSpread();

  const shield = device.partById.get('shield');
  const lid = device.partById.get('lid');
  const wires = device.partById.get('wires');

  if (shield) {
    shield.group.visible = state.showShield;
  }
  if (lid) {
    lid.group.visible = state.showLid;
  }
  if (wires) {
    wires.group.visible = state.showWires && state.explode < 0.05 && state.mode !== 'print';
  }

  refreshLabels();

  device.dimensions.visible = state.showDimensions && state.explode < 0.05;

  if (state.mode === 'wiring') {
    MAT.box.opacity = 0.05;
    MAT.lid.opacity = 0.16;
  } else if (state.mode === 'print') {
    MAT.box.opacity = 0.34;
    MAT.lid.opacity = 0.95;
  } else {
    MAT.box.opacity = 0.14;
    MAT.lid.opacity = 0.38;
  }
}
function refreshLabels(): void {
  for (const label of device.labels) {
    label.visible = state.showLabels;
  }
  if (state.selected) {
    for (const label of state.selected.labels) {
      label.visible = true;
    }
  }
}

function applyShieldSpread(): void {
  const shield = device.partById.get('shield');
  const plates = shield?.group.userData.plates as THREE.Group[] | undefined;
  if (!plates) {
    return;
  }
  for (const [index, plate] of plates.entries()) {
    plate.position.y = state.mode === 'print' ? index * 12 : 0;
  }
}

function applyExplode(): void {
  for (const part of device.parts) {
    part.group.position
      .copy(part.basePosition)
      .addScaledVector(part.explode, state.explode);
  }

  const wires = device.partById.get('wires');
  if (wires) {
    wires.group.visible = state.showWires && state.explode < 0.05 && state.mode !== 'print';
  }

  device.dimensions.visible = state.showDimensions && state.explode < 0.05;
}

function setMode(mode: Mode): void {
  state.mode = mode;
  clearConnection();
  clearSelection();

  if (mode === 'assembled') {
    state.showShield = true;
    state.showLid = true;
    state.showWires = true;
    state.showDimensions = false;
    state.explodeTarget = 0;
  } else if (mode === 'exploded') {
    state.showShield = false;
    state.showLid = true;
    state.showWires = false;
    state.showDimensions = false;
    state.explodeTarget = 1;
  } else if (mode === 'wiring') {
    state.showShield = false;
    state.showLid = false;
    state.showWires = true;
    state.showDimensions = false;
    state.explodeTarget = 0;
  } else if (mode === 'print') {
    state.showShield = true;
    state.showLid = true;
    state.showWires = false;
    state.showDimensions = false;
    state.explodeTarget = 0;
  }

  syncControls();
  applyVisibility();
  updateModeButtons();

  if (mode === 'print') {
    const shield = device.partById.get('shield');
    if (shield) {
      focusOn(shield.group);
      showCard(
        'Print view',
        'Radiation shield',
        'The white plates are the 3D-printed part. They are fanned out here to show the shape. The box and lid are a commercial IP65 enclosure.',
      );
    }
  } else {
    resetView();
  }
}

function updateModeButtons(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('.mode-row button')) {
    button.classList.toggle('active', button.dataset.mode === state.mode);
  }
}

function setExplodeTarget(value: number): void {
  state.explodeTarget = THREE.MathUtils.clamp(value, 0, 1);

  if (state.explodeTarget > 0.05) {
    state.showWires = false;
    state.showDimensions = false;
  }

  syncControls();
  applyVisibility();
}

function clearSelection(): void {
  state.selected = null;
  selectionBox.visible = false;
  partCard.classList.add('hidden');
  for (const button of partButtons.values()) {
    button.classList.remove('selected');
  }
  refreshLabels();
}

function showCard(kind: string, title: string, body: string): void {
  partCardKind.textContent = kind;
  partCardTitle.textContent = title;
  partCardBody.textContent = body;
  partCard.classList.remove('hidden');
}

function selectPart(part: Part, focus: boolean): void {
  if (state.mode === 'print' && electronics.has(part.id)) {
    setMode('assembled');
  } else if (state.mode === 'wiring' && (part.id === 'shield' || part.id === 'lid')) {
    setMode('assembled');
  }

  state.selected = part;
  state.activeConnection = null;
  clearConnection();
  updatePartButtons();

  showCard('Part', part.name, `${part.description} (${part.dimensions})`);

  selectionBox.visible = true;
  selectionBox.box.setFromObject(part.group);
  refreshLabels();

  if (focus) {
    focusOn(part.group);
  }
}

function updatePartButtons(): void {
  for (const [id, button] of partButtons) {
    button.classList.toggle('selected', state.selected?.id === id);
  }
}

function clearConnection(): void {
  state.activeConnection = null;
  const wires = device.partById.get('wires');
  if (wires) {
    for (const child of wires.group.children) {
      child.visible = true;
    }
  }
  for (const button of connectionButtons.values()) {
    button.classList.remove('selected');
  }
}

function activateConnection(connection: Connection): void {
  setMode('wiring');
  state.activeConnection = connection.id;
  state.showWires = true;
  syncControls();

  const wires = device.partById.get('wires');
  if (wires) {
    wires.group.visible = true;
    for (const child of wires.group.children) {
      const group = child.userData.connectionGroup as string | undefined;
      if (group) {
        child.visible = group === connection.group;
      }
    }
  }

  for (const [id, button] of connectionButtons) {
    button.classList.toggle('selected', id === connection.id);
  }

  showCard('Connection', connection.label, connection.detail);
}

function runStep(step: Step, element: HTMLLIElement): void {
  setMode(step.mode);

  const focus = step.focusId ? device.partById.get(step.focusId) : undefined;
  if (focus) {
    state.selected = focus;
    selectionBox.visible = true;
    selectionBox.box.setFromObject(focus.group);
    updatePartButtons();
    focusOn(focus.group);
  }

  showCard('Assembly step', step.title, step.body);

  if (activeStepElement) {
    activeStepElement.classList.remove('active');
  }
  activeStepElement = element;
  element.classList.add('active');
}

function focusOn(object: THREE.Object3D): void {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) {
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const distance = Math.max(size.length() * 1.6, 130);
  const direction = new THREE.Vector3(1, 0.55, 1).normalize();
  const toPosition = center.clone().addScaledVector(direction, distance);

  cameraTween = {
    fromPosition: camera.position.clone(),
    toPosition,
    fromTarget: controls.target.clone(),
    toTarget: center,
    t: 0,
  };
}

function resetView(): void {
  cameraTween = {
    fromPosition: camera.position.clone(),
    toPosition: new THREE.Vector3(150, 118, 188),
    fromTarget: controls.target.clone(),
    toTarget: new THREE.Vector3(0, 45, 0),
    t: 0,
  };
}

function pick(event: PointerEvent): THREE.Intersection | null {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  return hits[0] ?? null;
}

function partFromHit(hit: THREE.Intersection): Part | undefined {
  const id = hit.object.userData.partId as string | undefined;
  return id ? device.partById.get(id) : undefined;
}

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0) {
    return;
  }
  pointerDown = { x: event.clientX, y: event.clientY };
}

function onPointerUp(event: PointerEvent): void {
  if (event.button !== 0) {
    return;
  }
  const dx = event.clientX - pointerDown.x;
  const dy = event.clientY - pointerDown.y;
  if (Math.hypot(dx, dy) > 6) {
    return;
  }

  const hit = pick(event);
  if (!hit) {
    return;
  }

  const part = partFromHit(hit);
  if (!part) {
    return;
  }

  const connectionGroup = hit.object.userData.connectionGroup as string | undefined;
  if (part.id === 'wires' && connectionGroup) {
    const connection = CONNECTIONS.find((entry) => entry.group === connectionGroup);
    if (connection) {
      activateConnection(connection);
    }
    return;
  }

  selectPart(part, false);
}

function onPointerMove(event: PointerEvent): void {
  if (event.buttons !== 0) {
    return;
  }

  const hit = pick(event);
  const part = hit ? partFromHit(hit) : undefined;
  state.hovered = part ?? null;
  renderer.domElement.style.cursor = part ? 'pointer' : 'default';
}

function onPointerLeave(): void {
  state.hovered = null;
  renderer.domElement.style.cursor = 'default';
}

function onResize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
}

renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointerup', onPointerUp);
renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerleave', onPointerLeave);
window.addEventListener('resize', onResize);

buildUi();
syncControls();
updateModeButtons();
applyVisibility();

const clock = new THREE.Clock();
let firstFrame = true;

function render(): void {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (Math.abs(state.explodeTarget - state.explode) > 0.0005) {
    state.explode += (state.explodeTarget - state.explode) * Math.min(1, dt * 6.5);
    applyExplode();
  } else if (state.explode !== state.explodeTarget) {
    state.explode = state.explodeTarget;
    applyExplode();
  }

  if (cameraTween) {
    cameraTween.t = Math.min(1, cameraTween.t + dt * 2.6);
    const eased = 1 - Math.pow(1 - cameraTween.t, 3);
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
    if (cameraTween.t >= 1) {
      cameraTween = null;
    }
  }

  controls.update();

  if (state.selected && state.selected.group.visible) {
    selectionBox.box.setFromObject(state.selected.group);
    selectionBox.visible = true;
  } else {
    selectionBox.visible = false;
  }

  if (
    state.hovered &&
    state.hovered.group.visible &&
    state.hovered !== state.selected
  ) {
    hoverBox.box.setFromObject(state.hovered.group);
    hoverBox.visible = true;
  } else {
    hoverBox.visible = false;
  }

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  if (firstFrame) {
    firstFrame = false;
    loading.classList.add('done');
  }

  requestAnimationFrame(render);
}

render();
