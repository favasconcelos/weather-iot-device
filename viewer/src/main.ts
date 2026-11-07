import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CONNECTIONS, createDevice, STEPS } from './parts';
import { MAT } from './materials';
import type { Connection, Mode, Part, Step } from './types';
import './styles.css';

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing ${selector}`);
  }
  return element;
}

const stage = query<HTMLElement>('#stage');
const panel = query<HTMLElement>('#panel');
const panelScrim = query<HTMLElement>('#panel-scrim');
const panelToggle = query<HTMLButtonElement>('#panel-toggle');
const resetButton = query<HTMLButtonElement>('#reset-view');
const dockReset = query<HTMLButtonElement>('#dock-reset');
const partCard = query<HTMLElement>('#part-card');
const partCardKind = query<HTMLElement>('#part-card-kind');
const partCardTitle = query<HTMLElement>('#part-card-title');
const partCardBody = query<HTMLElement>('#part-card-body');
const partCardClose = query<HTMLButtonElement>('#part-card-close');
const partList = query<HTMLOListElement>('#part-list');
const connectionList = query<HTMLUListElement>('#connection-list');
const stepList = query<HTMLOListElement>('#step-list');
const explodeInput = query<HTMLInputElement>('#explode');
const explodeValue = query<HTMLOutputElement>('#explode-value');
const loading = query<HTMLElement>('#loading');
const inspectorKind = query<HTMLElement>('#inspector-kind');
const inspectorTitle = query<HTMLElement>('#inspector-title');
const inspectorBody = query<HTMLElement>('#inspector-body');
const inspectorMeta = query<HTMLElement>('#inspector-meta');
const inspectorClear = query<HTMLButtonElement>('#inspector-clear');
const showRow = query<HTMLElement>('.show-row');
const partsCount = query<HTMLElement>('#parts-count');
const wiringCount = query<HTMLElement>('#wiring-count');
const stepsCount = query<HTMLElement>('#steps-count');
const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.panel-tabs [role="tab"]'));
const tabPanels = Array.from(document.querySelectorAll<HTMLElement>('[data-panel]'));
const toggleButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.toggle'));
const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.mode-row button'));

const drawerQuery = window.matchMedia('(max-width: 900px)');
const phoneQuery = window.matchMedia('(max-width: 640px)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(40, 1, 1, 2000);
camera.position.set(150, 118, 188);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearAlpha(0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'label-layer';
stage.appendChild(labelRenderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.62;
pmrem.dispose();

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 45, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.minDistance = 90;
controls.maxDistance = 900;
controls.maxPolarAngle = Math.PI * 0.54;

scene.add(new THREE.HemisphereLight(0xfff6ea, 0xb3a58f, 1.15));

const keyLight = new THREE.DirectionalLight(0xfff4e2, 2.15);
keyLight.position.set(145, 235, 170);
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

const fillLight = new THREE.DirectionalLight(0xcfe2f2, 0.75);
fillLight.position.set(-180, 100, -150);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
rimLight.position.set(-40, 140, -220);
scene.add(rimLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(340, 64),
  new THREE.ShadowMaterial({ color: 0x3b3328, opacity: 0.2 }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.35;
ground.receiveShadow = true;
scene.add(ground);

const device = createDevice();
scene.add(device.root);

const clickableMeshes: THREE.Mesh[] = [];
device.root.traverse((object) => {
  if (object instanceof THREE.Mesh && object.userData.partId) {
    clickableMeshes.push(object);
  }
});

const selectionBox = new THREE.Box3Helper(new THREE.Box3(), 0xb5401a);
selectionBox.visible = false;
scene.add(selectionBox);

const hoverBox = new THREE.Box3Helper(new THREE.Box3(), 0x31627d);
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

interface InspectorContent {
  kind: string;
  title: string;
  body: string;
  meta?: string;
}

interface InspectorOptions {
  clear?: boolean;
  floating?: boolean;
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
  mode: 'assembled',
  selected: null,
  hovered: null,
  activeConnection: null,
  showShield: true,
  showLid: true,
  showWires: true,
  showLabels: false,
  showDimensions: false,
  explode: 0,
  explodeTarget: 0,
};

const electronics = new Set(['xiao', 'sht40', 'battery', 'led', 'reed', 'wires']);
const toggleStateKeys = {
  shield: 'showShield',
  lid: 'showLid',
  wires: 'showWires',
  labels: 'showLabels',
  dimensions: 'showDimensions',
} as const;

type ToggleName = keyof typeof toggleStateKeys;
type TabName = 'parts' | 'wiring' | 'steps';

let cameraTween: CameraTween | null = null;
let activeStepElement: HTMLLIElement | null = null;
let pointerDown = { x: 0, y: 0 };

const partButtons = new Map<string, HTMLButtonElement>();
const connectionButtons = new Map<string, HTMLButtonElement>();

const overview: InspectorContent = {
  kind: 'Overview',
  title: 'Temperature and humidity',
  body:
    'A battery-powered sensor for the office window. It reports to Home Assistant over Matter and Thread; ' +
    'a six-plate shield keeps sun and heat off the SHT40.',
  meta: `${device.parts.length} parts · ${STEPS.length} steps · 150 × 110 × 80 mm`,
};

const printInfo: InspectorContent = {
  kind: 'Print view',
  title: 'Radiation shield',
  body:
    'The white plates are the 3D-printed part. They are fanned out here to show the shape. ' +
    'The box and lid are a commercial IP65 enclosure.',
  meta: 'Six printed plates · approx. 150 × 110 mm',
};

function modeLabel(mode: Mode): string {
  if (mode === 'exploded') return 'Exploded';
  if (mode === 'wiring') return 'Wiring';
  if (mode === 'print') return 'Printed shield';
  return 'Assembled';
}

function setInspector(content: InspectorContent, options: InspectorOptions = {}): void {
  inspectorKind.textContent = content.kind;
  inspectorTitle.textContent = content.title;
  inspectorBody.textContent = content.body;
  inspectorMeta.textContent = content.meta ?? '';
  inspectorMeta.hidden = !content.meta;
  inspectorClear.hidden = !options.clear;

  if (options.floating) {
    partCardKind.textContent = content.kind;
    partCardTitle.textContent = content.title;
    partCardBody.textContent = content.body;
    partCard.hidden = false;
  } else {
    partCard.hidden = true;
  }
}

function resetInspector(): void {
  setInspector(overview);
}

function setTab(name: TabName): void {
  for (const tab of tabs) {
    const selected = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }

  for (const tabPanel of tabPanels) {
    tabPanel.hidden = tabPanel.dataset.panel !== name;
  }
}

function revealActiveRow(): void {
  const row = document.querySelector<HTMLElement>(
    '[data-panel]:not([hidden]) .list button[aria-pressed="true"], ' +
      '[data-panel]:not([hidden]) .step-list li.active button',
  );
  row?.scrollIntoView({ block: 'nearest' });
}

function setPanelOpen(open: boolean): void {
  const wasOpen = panel.classList.contains('open');
  const focusInsidePanel =
    document.activeElement instanceof HTMLElement && panel.contains(document.activeElement);

  panel.classList.toggle('open', open);
  panelToggle.setAttribute('aria-expanded', String(open));
  panelScrim.classList.toggle('open', open);
  panelScrim.hidden = !open;
  stage.inert = open;
  panel.inert = drawerQuery.matches && !open;

  if (open && !wasOpen) {
    const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0];
    activeTab?.focus();
  } else if (!open && wasOpen && drawerQuery.matches && focusInsidePanel) {
    panelToggle.focus();
  }
}

function closePanelOnPhone(): void {
  if (phoneQuery.matches) {
    setPanelOpen(false);
  }
}

function buildUi(): void {
  partsCount.textContent = String(device.parts.length);
  wiringCount.textContent = String(CONNECTIONS.length);
  stepsCount.textContent = String(STEPS.length);

  for (const [index, part] of device.parts.entries()) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.partId = part.id;
    button.setAttribute('aria-pressed', 'false');
    button.title = `${part.description} (${part.dimensions})`;

    const indexLabel = document.createElement('span');
    indexLabel.className = 'index';
    indexLabel.textContent = String(index + 1).padStart(2, '0');

    const text = document.createElement('span');
    text.className = 'part-text';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = part.name;

    const size = document.createElement('span');
    size.className = 'size';
    size.textContent = part.dimensions;

    text.append(name, size);
    button.append(indexLabel, text);
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
    button.setAttribute('aria-pressed', 'false');
    button.title = connection.detail;

    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.background = connection.css;

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = connection.label;

    button.append(chip, label);
    button.addEventListener('click', () => activateConnection(connection));
    item.appendChild(button);
    connectionList.appendChild(item);
    connectionButtons.set(connection.id, button);
  }

  for (const [index, step] of STEPS.entries()) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';

    const indexLabel = document.createElement('span');
    indexLabel.className = 'index';
    indexLabel.textContent = String(index + 1).padStart(2, '0');

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = step.title;

    button.append(indexLabel, label);
    button.addEventListener('click', () => runStep(step, item));
    item.appendChild(button);
    stepList.appendChild(item);
  }

  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode as Mode | undefined;
      if (mode) {
        setMode(mode);
      }
    });
  }

  for (const button of toggleButtons) {
    button.addEventListener('click', () => {
      const name = button.dataset.toggle as ToggleName | undefined;
      if (!name) {
        return;
      }
      const key = toggleStateKeys[name];
      state[key] = !state[key];

      if ((name === 'wires' || name === 'dimensions') && state[key] && state.explodeTarget > 0.05) {
        setExplodeTarget(0);
      }

      syncControls();
      applyVisibility();
    });
  }

  explodeInput.addEventListener('input', () => {
    setExplodeTarget(Number(explodeInput.value));
  });

  resetButton.addEventListener('click', () => resetView());
  dockReset.addEventListener('click', () => resetView());

  panelToggle.addEventListener('click', () => {
    setPanelOpen(!panel.classList.contains('open'));
  });

  panelScrim.addEventListener('click', () => setPanelOpen(false));
  partCardClose.addEventListener('click', () => clearAll());
  inspectorClear.addEventListener('click', () => clearAll());

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const name = tab.dataset.tab as TabName | undefined;
      if (name) {
        setTab(name);
      }
    });

    tab.addEventListener('keydown', (event) => {
      const current = tabs.indexOf(tab);
      let next = current;
      if (event.key === 'ArrowRight') {
        next = (current + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft') {
        next = (current - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        next = 0;
      } else if (event.key === 'End') {
        next = tabs.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      const nextTab = tabs[next];
      const name = nextTab.dataset.tab as TabName | undefined;
      if (name) {
        setTab(name);
      }
      nextTab.focus();
    });
  }

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }
    if (panel.classList.contains('open')) {
      setPanelOpen(false);
      return;
    }
    clearAll();
  });

  drawerQuery.addEventListener('change', () => {
    setPanelOpen(false);
  });
}

function syncControls(): void {
  for (const button of toggleButtons) {
    const name = button.dataset.toggle as ToggleName | undefined;
    if (name) {
      button.setAttribute('aria-pressed', String(state[toggleStateKeys[name]]));
    }
  }

  explodeInput.value = String(state.explodeTarget);
  explodeValue.textContent = `${Math.round(state.explodeTarget * 100)}%`;
  explodeInput.style.setProperty('--pct', `${state.explodeTarget * 100}%`);
}

function applyVisibility(): void {
  const printMode = state.mode === 'print';

  for (const part of device.parts) {
    const hiddenForPrint = printMode && (electronics.has(part.id) || part.id === 'box' || part.id === 'lid');
    part.group.visible = !hiddenForPrint;
  }

  applyShieldSpread();

  const shield = device.partById.get('shield');
  const lid = device.partById.get('lid');
  const box = device.partById.get('box');
  const wires = device.partById.get('wires');

  if (shield) {
    shield.group.visible = state.showShield;
  }
  if (box) {
    box.group.visible = !printMode;
  }
  if (lid) {
    lid.group.visible = state.showLid && !printMode;
  }
  if (wires) {
    wires.group.visible = state.showWires && state.explode < 0.05 && !printMode;
  }

  refreshLabels();

  device.dimensions.visible = state.showDimensions && state.explode < 0.05 && !printMode;

  if (state.mode === 'wiring') {
    MAT.box.opacity = 0.08;
    MAT.lid.opacity = 0.12;
  } else if (state.mode === 'print') {
    MAT.box.opacity = 0.12;
    MAT.lid.opacity = 0.2;
  } else {
    MAT.box.opacity = 0.12;
    MAT.lid.opacity = 0.3;
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
    part.group.position.copy(part.basePosition).addScaledVector(part.explode, state.explode);
  }

  const wires = device.partById.get('wires');
  if (wires) {
    wires.group.visible = state.showWires && state.explode < 0.05 && state.mode !== 'print';
  }

  device.dimensions.visible = state.showDimensions && state.explode < 0.05 && state.mode !== 'print';
}

function setMode(mode: Mode): void {
  state.mode = mode;
  stage.dataset.mode = mode;
  showRow.hidden = mode === 'print';

  clearSelection();
  clearConnection();
  clearActiveStep();
  resetInspector();

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
    state.showLid = false;
    state.showWires = false;
    state.showDimensions = false;
    state.explodeTarget = 0;
  }

  syncControls();
  applyVisibility();
  updateModeButtons();

  if (mode === 'print') {
    // The shield is shown fanned out, not exploded. Snap the explode offset
    // before framing so the camera does not aim at the lifted position.
    state.explode = 0;
    applyExplode();

    const shield = device.partById.get('shield');
    if (shield) {
      focusOn(shield.group);
    }
    setInspector(printInfo, { clear: true });
  } else {
    resetView();
  }
}

function updateModeButtons(): void {
  for (const button of modeButtons) {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  }
}

function setExplodeTarget(value: number): void {
  state.explodeTarget = THREE.MathUtils.clamp(value, 0, 1);

  if (state.explodeTarget > 0.05) {
    state.showWires = false;
    state.showDimensions = false;
  }

  if (reduceMotion.matches) {
    state.explode = state.explodeTarget;
    applyExplode();
  }

  syncControls();
  applyVisibility();
}

function clearSelection(): void {
  state.selected = null;
  selectionBox.visible = false;
  putCardAway();
  for (const button of partButtons.values()) {
    button.setAttribute('aria-pressed', 'false');
  }
  refreshLabels();
}

function putCardAway(): void {
  partCard.hidden = true;
  partCardKind.textContent = '';
  partCardTitle.textContent = '';
  partCardBody.textContent = '';
}

function selectPart(part: Part, focus: boolean): void {
  const internal = electronics.has(part.id);

  if (state.mode === 'assembled' && internal) {
    setMode('wiring');
  } else if (state.mode === 'print' && (internal || part.id === 'box' || part.id === 'lid')) {
    setMode(internal ? 'wiring' : 'assembled');
  } else if (state.mode === 'wiring' && (part.id === 'shield' || part.id === 'lid')) {
    setMode('assembled');
  }

  state.selected = part;
  state.activeConnection = null;
  clearConnection();
  updatePartButtons();

  setInspector(
    {
      kind: 'Part',
      title: part.name,
      body: part.description,
      meta: part.dimensions,
    },
    { clear: true, floating: true },
  );
  setTab('parts');
  revealActiveRow();

  selectionBox.visible = true;
  selectionBox.box.setFromObject(part.group);
  refreshLabels();

  if (focus) {
    focusOn(part.group);
  }

  closePanelOnPhone();
}

function updatePartButtons(): void {
  for (const [id, button] of partButtons) {
    button.setAttribute('aria-pressed', String(state.selected?.id === id));
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
    button.setAttribute('aria-pressed', 'false');
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
    button.setAttribute('aria-pressed', String(id === connection.id));
  }

  setInspector(
    {
      kind: 'Connection',
      title: connection.label,
      body: connection.detail,
      meta: 'Wires isolated in the model',
    },
    { clear: true, floating: true },
  );
  setTab('wiring');
  revealActiveRow();
  closePanelOnPhone();
}

function clearActiveStep(): void {
  if (activeStepElement) {
    activeStepElement.classList.remove('active');
    activeStepElement = null;
  }
}

function runStep(step: Step, element: HTMLLIElement): void {
  const focus = step.focusId ? device.partById.get(step.focusId) : undefined;
  const mode: Mode =
    focus && electronics.has(focus.id) && step.mode === 'assembled' ? 'wiring' : step.mode;

  setMode(mode);

  if (focus) {
    state.selected = focus;
    selectionBox.visible = true;
    selectionBox.box.setFromObject(focus.group);
    updatePartButtons();
    focusOn(focus.group);
  }

  setInspector(
    {
      kind: `Assembly step ${STEPS.indexOf(step) + 1} of ${STEPS.length}`,
      title: step.title,
      body: step.body,
      meta: `View: ${modeLabel(mode)}`,
    },
    { clear: true, floating: true },
  );

  clearActiveStep();
  activeStepElement = element;
  element.classList.add('active');
  setTab('steps');
  revealActiveRow();
  closePanelOnPhone();
}

function clearAll(): void {
  clearSelection();
  clearConnection();
  clearActiveStep();
  resetInspector();
}

function fitDistance(radius: number): number {
  const verticalHalf = THREE.MathUtils.degToRad(camera.fov * 0.5);
  const horizontalHalf = Math.atan(Math.tan(verticalHalf) * camera.aspect);
  return radius / Math.sin(Math.min(verticalHalf, horizontalHalf));
}

function focusOn(object: THREE.Object3D): void {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) {
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.length() * 0.5, 68);
  const distance = THREE.MathUtils.clamp(fitDistance(radius), controls.minDistance, controls.maxDistance);
  const direction = new THREE.Vector3(1, 0.55, 1).normalize();
  const toPosition = center.clone().addScaledVector(direction, distance);

  if (reduceMotion.matches) {
    camera.position.copy(toPosition);
    controls.target.copy(center);
    controls.update();
    cameraTween = null;
    return;
  }

  cameraTween = {
    fromPosition: camera.position.clone(),
    toPosition,
    fromTarget: controls.target.clone(),
    toTarget: center,
    t: 0,
  };
}

function visibleTargetBounds(): THREE.Box3 {
  const bounds = new THREE.Box3();
  const partBounds = new THREE.Box3();

  for (const part of device.parts) {
    if (!part.group.visible) {
      continue;
    }
    partBounds.setFromObject(part.group);
    const targetPosition = part.basePosition
      .clone()
      .addScaledVector(part.explode, state.explodeTarget);
    partBounds.translate(targetPosition.sub(part.group.position));
    bounds.union(partBounds);
  }

  if (bounds.isEmpty()) {
    bounds.setFromCenterAndSize(
      new THREE.Vector3(0, 45, 0),
      new THREE.Vector3(150, 100, 110),
    );
  }

  return bounds;
}

function resetView(immediate = false): void {
  const bounds = visibleTargetBounds();
  const target = bounds.getCenter(new THREE.Vector3());
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  const direction = new THREE.Vector3(1, 0.5, 1).normalize();
  const distance = THREE.MathUtils.clamp(
    fitDistance(sphere.radius * 1.03),
    controls.minDistance,
    controls.maxDistance,
  );
  const toPosition = target.clone().addScaledVector(direction, distance);

  if (immediate || reduceMotion.matches) {
    camera.position.copy(toPosition);
    controls.target.copy(target);
    controls.update();
    cameraTween = null;
    return;
  }

  cameraTween = {
    fromPosition: camera.position.clone(),
    toPosition,
    fromTarget: controls.target.clone(),
    toTarget: target,
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
  renderer.domElement.style.cursor = 'grabbing';
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

  renderer.domElement.style.cursor = 'grab';

  const hit = pick(event);
  if (!hit) {
    clearAll();
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
  renderer.domElement.style.cursor = part ? 'pointer' : 'grab';
}

function onPointerLeave(): void {
  state.hovered = null;
  renderer.domElement.style.cursor = 'grab';
}

function refitCamera(): void {
  const bounds = visibleTargetBounds();
  const target = bounds.getCenter(new THREE.Vector3());
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  const direction = camera.position.clone().sub(controls.target).normalize();
  const distance = THREE.MathUtils.clamp(
    fitDistance(sphere.radius * 1.03),
    controls.minDistance,
    controls.maxDistance,
  );

  camera.position.copy(target).addScaledVector(direction, distance);
  controls.target.copy(target);
  controls.update();
  cameraTween = null;
}

function resizeRenderer(): void {
  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  const previousAspect = camera.aspect;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);

  if (Math.abs(previousAspect - camera.aspect) > 0.001) {
    refitCamera();
  }
}

renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointerup', onPointerUp);
renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerleave', onPointerLeave);

resizeRenderer();
new ResizeObserver(resizeRenderer).observe(stage);

buildUi();
setPanelOpen(false);
syncControls();
updateModeButtons();
stage.dataset.mode = state.mode;
setTab('parts');
resetInspector();
applyVisibility();
resetView(true);

const timer = new THREE.Timer();
timer.connect(document);
let firstFrame = true;

function render(): void {
  timer.update();
  const dt = Math.min(timer.getDelta(), 0.05);

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

  if (state.hovered && state.hovered.group.visible && state.hovered !== state.selected) {
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
