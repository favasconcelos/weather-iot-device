import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createGround } from './ground';
import { applyMaterialTheme, MAT } from './materials';
import { CONNECTIONS, createDevice, STEPS } from './parts';
import { PART_SWATCH } from './part-swatches';
import { initSheet } from './sheet';
import { applyTheme, getInitialTheme } from './theme';
import { readUrlState, writeUrlState } from './url-state';
import type { Connection, Mode, Part, Theme } from './types';
import './styles.css';

const MODES: readonly Mode[] = ['assembled', 'exploded', 'wiring', 'print'];
const TABS = ['steps', 'parts', 'wiring', 'view'] as const;
type TabId = (typeof TABS)[number];

const HOME_POSITION = new THREE.Vector3(150, 118, 188);
const HOME_TARGET = new THREE.Vector3(0, 45, 0);

const SCENE_THEME: Record<
  Theme,
  { accent: number; hover: number; shadow: number; glass: number }
> = {
  dark: { accent: 0x5ee0b4, hover: 0x9ad7ff, shadow: 0.34, glass: 1 },
  light: { accent: 0x0a7a5a, hover: 0x2b6cb0, shadow: 0.18, glass: 1.7 },
};

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }
  return element;
}

const app = query<HTMLElement>('#app');
const stage = query<HTMLElement>('#stage');
const drawer = query<HTMLElement>('#drawer');
const tabPanelsEl = query<HTMLElement>('.tab-panels');
const grabber = query<HTMLButtonElement>('#grabber');
const dock = query<HTMLElement>('#dock');
const modeRow = query<HTMLElement>('#mode-row');
const legend = query<HTMLElement>('#legend');
const panelToggle = query<HTMLButtonElement>('#panel-toggle');
const themeToggle = query<HTMLButtonElement>('#theme-toggle');
const resetButton = query<HTMLButtonElement>('#reset-view');
const partCard = query<HTMLElement>('#part-card');
const partCardKind = query<HTMLElement>('#part-card-kind');
const partCardTitle = query<HTMLElement>('#part-card-title');
const partCardBody = query<HTMLElement>('#part-card-body');
const partCardClose = query<HTMLButtonElement>('#part-card-close');
const partList = query<HTMLUListElement>('#part-list');
const connectionList = query<HTMLUListElement>('#connection-list');
const stepList = query<HTMLOListElement>('#step-list');
const stepCount = query<HTMLElement>('#step-count');
const stepTitle = query<HTMLElement>('#step-title');
const stepPrev = query<HTMLButtonElement>('#step-prev');
const stepNext = query<HTMLButtonElement>('#step-next');
const stepNextLabel = query<HTMLElement>('#step-next-label');
const stepBar = query<HTMLElement>('#step-bar');
const explodeInputs = [
  query<HTMLInputElement>('#explode'),
  query<HTMLInputElement>('#explode-alt'),
];
const explodeValues = [
  query<HTMLOutputElement>('#explode-value'),
  query<HTMLOutputElement>('#explode-value-alt'),
];
const toggleShield = query<HTMLInputElement>('#toggle-shield');
const toggleLid = query<HTMLInputElement>('#toggle-lid');
const toggleWires = query<HTMLInputElement>('#toggle-wires');
const toggleLabels = query<HTMLInputElement>('#toggle-labels');
const toggleDimensions = query<HTMLInputElement>('#toggle-dimensions');
const hint = query<HTMLElement>('#hint');
const loading = query<HTMLElement>('#loading');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sidePanelQuery = window.matchMedia('(min-width: 700px)');
const lowPower =
  window.matchMedia('(pointer: coarse)').matches ||
  Math.min(window.screen.width, window.screen.height) < 700;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.copy(HOME_POSITION);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setClearAlpha(0);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
stage.insertBefore(renderer.domElement, stage.firstChild);
renderer.domElement.setAttribute('role', 'img');
renderer.domElement.setAttribute(
  'aria-label',
  '3D model of the window weather sensor. Use the panel to change views, pick parts and follow the build steps.',
);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
stage.insertBefore(labelRenderer.domElement, renderer.domElement.nextSibling);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(HOME_TARGET);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.minDistance = 90;
controls.maxDistance = 760;
controls.maxPolarAngle = Math.PI * 0.54;
controls.update();

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;
pmrem.dispose();

scene.add(new THREE.HemisphereLight(0xd9efff, 0x0a1118, 0.8));

const keyLight = new THREE.DirectionalLight(0xfff2dd, 2.35);
keyLight.position.set(145, 230, 165);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
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

const shadowMaterial = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.34 });
const shadowGround = new THREE.Mesh(new THREE.CircleGeometry(340, 64), shadowMaterial);
shadowGround.rotation.x = -Math.PI / 2;
shadowGround.position.y = -0.35;
shadowGround.receiveShadow = true;
scene.add(shadowGround);

const initialTheme = getInitialTheme();
const ground = createGround(initialTheme, renderer.capabilities.getMaxAnisotropy());
scene.add(ground.mesh);

const device = createDevice();
scene.add(device.root);

const clickableMeshes: THREE.Mesh[] = [];
device.root.traverse((object) => {
  if (object instanceof THREE.Mesh && object.userData.partId) {
    clickableMeshes.push(object);
  }
});

const selectionBox = new THREE.Box3Helper(new THREE.Box3(), SCENE_THEME[initialTheme].accent);
selectionBox.visible = false;
scene.add(selectionBox);

const hoverBox = new THREE.Box3Helper(new THREE.Box3(), SCENE_THEME[initialTheme].hover);
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
  theme: Theme;
  tab: TabId;
  step: number;
  selected: Part | null;
  hovered: Part | null;
  showShield: boolean;
  showLid: boolean;
  showWires: boolean;
  showLabels: boolean;
  showDimensions: boolean;
  explode: number;
  explodeTarget: number;
  drawerOpen: boolean;
}

const state: ViewState = {
  mode: 'wiring',
  theme: initialTheme,
  tab: 'steps',
  step: -1,
  selected: null,
  hovered: null,
  showShield: false,
  showLid: false,
  showWires: true,
  showLabels: false,
  showDimensions: false,
  explode: 0,
  explodeTarget: 0,
  drawerOpen: window.innerWidth >= 1024 || (window.innerWidth >= 700 && window.innerHeight >= 700),
};

const electronics = new Set(['xiao', 'hat', 'battery', 'led', 'reed', 'wires']);
let cameraTween: CameraTween | null = null;
let pointerDown = { x: 0, y: 0 };
let framesNeeded = 2;

const partButtons = new Map<string, HTMLButtonElement>();
const connectionButtons = new Map<string, HTMLButtonElement>();
const stepButtons: HTMLButtonElement[] = [];
const tabButtons = new Map<TabId, HTMLButtonElement>();
const tabPanels = new Map<TabId, HTMLElement>();

/** Asks the render loop to draw again; idle frames are skipped to save battery. */
function invalidate(frames = 2): void {
  framesNeeded = Math.max(framesNeeded, frames);
}

function currentPartId(): Part['id'] | undefined {
  return state.selected?.id;
}

function syncUrl(): void {
  writeUrlState({
    mode: state.mode === 'wiring' && state.step < 0 && !state.selected ? undefined : state.mode,
    part: currentPartId(),
    step: state.step,
  });
}

/* ---------- Layout framing: keep the model centred in the free area ---------- */

const viewOffset = { x: 0, y: 0 };
const viewTarget = { x: 0, y: 0 };

function updateLayout(snap = false): void {
  const phone = !sidePanelQuery.matches;
  const gap = 16;
  let left = 0;
  let bottom = 0;

  if (phone) {
    app.style.setProperty('--sheet-h', `${drawer.offsetHeight}px`);
    app.style.setProperty('--inset-left', '0px');
    const dockRect = dock.getBoundingClientRect();
    let edge = dockRect.top;
    if (!partCard.classList.contains('hidden')) {
      edge = Math.min(edge, partCard.getBoundingClientRect().top);
    }
    bottom = Math.max(0, window.innerHeight - edge + 8);
  } else {
    left = state.drawerOpen ? drawer.offsetWidth + gap * 2 : 0;
    app.style.setProperty('--inset-left', `${left}px`);
    bottom = Math.max(0, window.innerHeight - dock.getBoundingClientRect().top + 8);
  }

  viewTarget.x = left / 2;
  viewTarget.y = bottom / 2;
  if (snap || reduceMotion.matches) {
    viewOffset.x = viewTarget.x;
    viewOffset.y = viewTarget.y;
    applyViewOffset();
  }
  invalidate();
}

function applyViewOffset(): void {
  if (Math.abs(viewOffset.x) < 0.5 && Math.abs(viewOffset.y) < 0.5) {
    camera.clearViewOffset();
  } else {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.setViewOffset(width, height, -viewOffset.x, viewOffset.y, width, height);
  }
}

/* ---------- UI construction ---------- */

function makeRow(
  className: string,
  contents: string,
  onClick: () => void,
): { item: HTMLLIElement; button: HTMLButtonElement } {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.innerHTML = contents;
  button.addEventListener('click', onClick);
  item.appendChild(button);
  return { item, button };
}

function buildUi(): void {
  for (const part of device.parts) {
    const { item, button } = makeRow(
      'row',
      `<span class="swatch" style="--sw:${PART_SWATCH[part.id]}"></span>
       <span class="row-text"><span class="row-title">${part.name}</span><span class="row-sub">${part.dimensions}</span></span>`,
      () => selectPart(part, true),
    );
    button.dataset.partId = part.id;
    button.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') {
        setHovered(part);
      }
    });
    button.addEventListener('pointerleave', () => setHovered(null));
    button.addEventListener('focus', () => setHovered(part));
    button.addEventListener('blur', () => setHovered(null));
    partList.appendChild(item);
    partButtons.set(part.id, button);
  }

  for (const connection of CONNECTIONS) {
    const { item, button } = makeRow(
      'row',
      `<span class="chip" style="background:${connection.css}"></span>
       <span class="row-text"><span class="row-title">${connection.label}</span></span>`,
      () => activateConnection(connection),
    );
    button.dataset.connectionId = connection.id;
    button.title = connection.detail;
    connectionList.appendChild(item);
    connectionButtons.set(connection.id, button);
  }

  for (const [index, step] of STEPS.entries()) {
    const { item, button } = makeRow(
      'row step',
      `<span class="step-num">${index + 1}</span>
       <span class="row-text"><span class="row-title">${step.title}</span></span>`,
      () => goToStep(index),
    );
    button.dataset.stepIndex = String(index);
    stepList.appendChild(item);
    stepButtons.push(button);
  }

  for (const id of TABS) {
    const button = query<HTMLButtonElement>(`#tab-${id}`);
    tabButtons.set(id, button);
    tabPanels.set(id, query<HTMLElement>(`#panel-${id}`));
    button.addEventListener('click', () => {
      setTab(id);
      if (sheet.isPhone() && sheet.getSnap() === 'peek') {
        sheet.setSnap('half');
      }
    });
    button.addEventListener('keydown', (event) => {
      const index = TABS.indexOf(id);
      let next = index;
      if (event.key === 'ArrowRight') {
        next = (index + 1) % TABS.length;
      } else if (event.key === 'ArrowLeft') {
        next = (index - 1 + TABS.length) % TABS.length;
      } else if (event.key === 'Home') {
        next = 0;
      } else if (event.key === 'End') {
        next = TABS.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      setTab(TABS[next], true);
    });
  }

  for (const button of modeRow.querySelectorAll<HTMLButtonElement>('button')) {
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

  for (const input of explodeInputs) {
    input.addEventListener('input', () => setExplodeTarget(Number(input.value)));
  }

  stepPrev.addEventListener('click', () => goToStep(state.step - 1));
  stepNext.addEventListener('click', () => {
    goToStep(state.step >= STEPS.length - 1 ? 0 : state.step + 1);
  });

  resetButton.addEventListener('click', resetView);
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-camera]')) {
    button.addEventListener('click', () => nudgeCamera(button.dataset.camera as CameraNudge));
  }
  themeToggle.addEventListener('click', () =>
    setTheme(state.theme === 'dark' ? 'light' : 'dark', true),
  );
  panelToggle.addEventListener('click', () => setDrawerOpen(!state.drawerOpen));

  partCardClose.addEventListener('click', () => {
    clearConnection();
    clearSelection();
    syncUrl();
  });
  partCard.addEventListener('click', (event) => {
    if (!sidePanelQuery.matches && !(event.target as Element).closest('#part-card-close')) {
      partCard.classList.toggle('expanded');
      updateLayout();
    }
  });
}

function setTab(id: TabId, focus = false): void {
  state.tab = id;
  for (const [key, button] of tabButtons) {
    const selected = key === id;
    button.setAttribute('aria-selected', String(selected));
    if (selected) {
      button.removeAttribute('tabindex');
    } else {
      button.tabIndex = -1;
    }
    if (selected && focus) {
      button.focus();
    }
  }
  for (const [key, panel] of tabPanels) {
    panel.hidden = key !== id;
  }
}

function setDrawerOpen(open: boolean): void {
  state.drawerOpen = open;
  drawer.classList.toggle('collapsed', !open);
  panelToggle.setAttribute('aria-expanded', String(open));
  panelToggle.setAttribute('aria-label', open ? 'Hide panel' : 'Show panel');
  updateLayout();
}

function setTheme(theme: Theme, persist = false): void {
  state.theme = theme;
  applyTheme(theme, persist);
  applyMaterialTheme(theme);
  ground.setTheme(theme);
  shadowMaterial.opacity = SCENE_THEME[theme].shadow;
  (selectionBox.material as THREE.LineBasicMaterial).color.setHex(SCENE_THEME[theme].accent);
  (hoverBox.material as THREE.LineBasicMaterial).color.setHex(SCENE_THEME[theme].hover);
  themeToggle.setAttribute(
    'aria-label',
    theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
  );
  applyVisibility();
}

function syncControls(): void {
  toggleShield.checked = state.showShield;
  toggleLid.checked = state.showLid;
  toggleWires.checked = state.showWires;
  toggleLabels.checked = state.showLabels;
  toggleDimensions.checked = state.showDimensions;
  for (const [index, input] of explodeInputs.entries()) {
    input.value = String(state.explodeTarget);
    explodeValues[index].textContent = `${Math.round(state.explodeTarget * 100)}%`;
  }
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

  const boost = SCENE_THEME[state.theme].glass;
  const clamp = (value: number): number => Math.min(0.98, value * boost);
  if (state.mode === 'wiring') {
    MAT.box.opacity = clamp(0.05);
    MAT.lid.opacity = clamp(0.16);
  } else if (state.mode === 'print') {
    MAT.box.opacity = clamp(0.34);
    MAT.lid.opacity = Math.min(0.98, 0.95);
  } else {
    MAT.box.opacity = clamp(0.14);
    MAT.lid.opacity = clamp(0.38);
  }

  invalidate();
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

  syncUrl();
}

function updateModeButtons(): void {
  for (const button of modeRow.querySelectorAll<HTMLButtonElement>('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
  }
  modeRow.style.setProperty('--i', String(Math.max(0, MODES.indexOf(state.mode))));
  legend.hidden = state.mode !== 'wiring';
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

function setHovered(part: Part | null): void {
  if (state.hovered === part) {
    return;
  }
  state.hovered = part;
  for (const [id, button] of partButtons) {
    button.classList.toggle('hover', part?.id === id && state.selected?.id !== id);
  }
  invalidate();
}

function clearSelection(): void {
  state.selected = null;
  selectionBox.visible = false;
  partCard.classList.add('hidden');
  for (const button of partButtons.values()) {
    button.classList.remove('selected');
  }
  refreshLabels();
  updateLayout();
}

function showCard(kind: string, title: string, body: string): void {
  partCardKind.textContent = kind;
  partCardTitle.textContent = title;
  partCardBody.textContent = body;
  partCard.classList.remove('hidden', 'expanded');
  partCard.style.animation = 'none';
  void partCard.offsetWidth;
  partCard.style.animation = '';
  updateLayout();
}

function selectPart(part: Part, focus: boolean): void {
  if (state.mode === 'print' && electronics.has(part.id)) {
    setMode('assembled');
  } else if (state.mode === 'wiring' && (part.id === 'shield' || part.id === 'lid')) {
    setMode('assembled');
  }

  state.selected = part;
  clearConnection();
  updatePartButtons();

  showCard('Part', part.name, `${part.description} (${part.dimensions})`);

  selectionBox.visible = true;
  selectionBox.box.setFromObject(part.group);
  refreshLabels();

  if (focus) {
    focusOn(part.group);
  }

  partButtons.get(part.id)?.scrollIntoView({ block: 'nearest' });
  syncUrl();
}

function updatePartButtons(): void {
  for (const [id, button] of partButtons) {
    button.classList.toggle('selected', state.selected?.id === id);
    if (state.selected?.id === id) {
      button.classList.remove('hover');
    }
  }
}

function clearConnection(): void {
  const wires = device.partById.get('wires');
  if (wires) {
    for (const child of wires.group.children) {
      child.visible = true;
    }
  }
  for (const button of connectionButtons.values()) {
    button.classList.remove('selected');
  }
  invalidate();
}

function activateConnection(connection: Connection): void {
  setMode('wiring');
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

function updateStepper(): void {
  const total = STEPS.length;
  const index = state.step;
  const atEnd = index === total - 1;

  stepCount.textContent = index < 0 ? `Build guide · ${total} steps` : `Step ${index + 1} of ${total}`;
  stepTitle.textContent = index < 0 ? 'Walk through the build' : STEPS[index].title;
  stepPrev.disabled = index <= 0;
  stepNextLabel.textContent = index < 0 ? 'Start' : atEnd ? 'Restart' : 'Next';
  stepNext.setAttribute(
    'aria-label',
    index < 0 ? 'Start build guide' : atEnd ? 'Restart build guide' : 'Next step',
  );
  stepBar.style.width = `${((index + 1) / total) * 100}%`;

  for (const [position, button] of stepButtons.entries()) {
    button.classList.toggle('active', position === index);
    button.classList.toggle('done', position < index);
    if (position === index) {
      button.setAttribute('aria-current', 'step');
      if (state.tab === 'steps') {
        button.scrollIntoView({ block: 'nearest' });
      }
    } else {
      button.removeAttribute('aria-current');
    }
  }
}

function goToStep(index: number): void {
  const clamped = THREE.MathUtils.clamp(index, 0, STEPS.length - 1);
  const step = STEPS[clamped];
  setMode(step.mode);
  state.step = clamped;

  const focus = step.focusId ? device.partById.get(step.focusId) : undefined;
  if (focus && state.mode === 'assembled' && electronics.has(focus.id)) {
    // The board sits inside the shield and lid, so open them up for this step.
    state.showShield = false;
    state.showLid = false;
    syncControls();
    applyVisibility();
  }
  if (focus) {
    state.selected = focus;
    selectionBox.visible = true;
    selectionBox.box.setFromObject(focus.group);
    updatePartButtons();
    focusOn(focus.group);
  }

  showCard(`Step ${clamped + 1} of ${STEPS.length}`, step.title, step.body);
  updateStepper();
  syncUrl();
}

/** Pulls the camera back when the free area is narrow so the model still fits. */
function framingScale(): number {
  const freeWidth = Math.max(160, window.innerWidth - viewTarget.x * 2);
  const freeHeight = Math.max(160, window.innerHeight - viewTarget.y * 2);
  return THREE.MathUtils.clamp(1.4 / (freeWidth / freeHeight), 1, 2.8);
}

function focusOn(object: THREE.Object3D): void {
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) {
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const distance = Math.max(size.length() * 1.85, 130) * Math.sqrt(framingScale());
  const direction = new THREE.Vector3(1, 0.55, 1).normalize();
  const toPosition = center.clone().addScaledVector(direction, distance);

  startTween(toPosition, center);
}

function resetView(): void {
  const scale = framingScale();
  if (state.mode === 'exploded') {
    // The exploded stack is taller, so pull back and aim a little higher.
    const target = new THREE.Vector3(0, 62, 0);
    const offset = HOME_POSITION.clone().sub(HOME_TARGET).multiplyScalar(1.3 * scale);
    startTween(target.clone().add(offset), target);
    return;
  }
  const offset = HOME_POSITION.clone().sub(HOME_TARGET).multiplyScalar(scale);
  startTween(HOME_TARGET.clone().add(offset), HOME_TARGET.clone());
}

type CameraNudge = 'rotate-left' | 'rotate-right' | 'zoom-in' | 'zoom-out';

/** One-click camera moves, an alternative to dragging and pinching. */
function nudgeCamera(kind: CameraNudge): void {
  const offset = camera.position.clone().sub(controls.target);
  if (kind === 'zoom-in') {
    offset.multiplyScalar(0.78);
  } else if (kind === 'zoom-out') {
    offset.multiplyScalar(1.28);
  } else {
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), kind === 'rotate-left' ? Math.PI / 9 : -Math.PI / 9);
  }
  offset.clampLength(controls.minDistance, controls.maxDistance);
  startTween(controls.target.clone().add(offset), controls.target.clone());
}

function startTween(toPosition: THREE.Vector3, toTarget: THREE.Vector3): void {
  cameraTween = {
    fromPosition: camera.position.clone(),
    toPosition,
    fromTarget: controls.target.clone(),
    toTarget,
    t: reduceMotion.matches ? 1 : 0,
  };
  invalidate();
}

/* ---------- Pointer picking ---------- */

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
    if (state.selected || !partCard.classList.contains('hidden')) {
      clearConnection();
      clearSelection();
      syncUrl();
    }
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
  if (event.buttons !== 0 || event.pointerType !== 'mouse') {
    return;
  }

  const hit = pick(event);
  const part = hit ? partFromHit(hit) : undefined;
  setHovered(part ?? null);
  renderer.domElement.style.cursor = part ? 'pointer' : 'default';
}

function onPointerLeave(): void {
  setHovered(null);
  renderer.domElement.style.cursor = 'default';
}

function onResize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const wasPortrait = camera.aspect < 1;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
  if (sidePanelQuery.matches) {
    drawer.classList.toggle('collapsed', !state.drawerOpen);
  }
  syncPanelAccess(sheet.getSnap());
  updateLayout(true);
  if (wasPortrait !== camera.aspect < 1 && !state.selected) {
    resetView();
  }
}

/* ---------- Keyboard ---------- */

function onKeyDown(event: KeyboardEvent): void {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }
  const target = event.target as HTMLElement;
  if (target.closest('input, textarea, select, [role="tablist"]')) {
    return;
  }

  const key = event.key.toLowerCase();
  const modeIndex = Number(key) - 1;
  if (modeIndex >= 0 && modeIndex < MODES.length) {
    setMode(MODES[modeIndex]);
  } else if (key === 'e') {
    setMode(state.explodeTarget > 0.5 ? 'assembled' : 'exploded');
  } else if (key === 'r') {
    resetView();
  } else if (key === '+' || key === '=') {
    nudgeCamera('zoom-in');
  } else if (key === '-' || key === '_') {
    nudgeCamera('zoom-out');
  } else if (key === 'p' && sidePanelQuery.matches) {
    setDrawerOpen(!state.drawerOpen);
  } else if (key === 'escape') {
    clearConnection();
    clearSelection();
    syncUrl();
  } else if (key === 'arrowright') {
    goToStep(state.step + 1);
  } else if (key === 'arrowleft') {
    goToStep(state.step - 1);
  }
}

/* ---------- First-visit hint ---------- */

function showHint(): void {
  try {
    if (window.localStorage.getItem('gws-hint')) {
      return;
    }
  } catch {
    return;
  }
  const touch = window.matchMedia('(pointer: coarse)').matches;
  hint.textContent = touch
    ? 'Drag to rotate · pinch to zoom · tap a part'
    : 'Drag to rotate · scroll to zoom · click a part';
  hint.classList.remove('hidden');

  const hide = (): void => {
    hint.classList.add('hidden');
    try {
      window.localStorage.setItem('gws-hint', '1');
    } catch {
      // Ignore blocked storage.
    }
  };
  window.setTimeout(hide, 6500);
  renderer.domElement.addEventListener('pointerdown', hide, { once: true });
}

/* ---------- Start ---------- */

renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointerup', onPointerUp);
renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('pointerleave', onPointerLeave);
window.addEventListener('resize', onResize);
window.addEventListener('keydown', onKeyDown);
controls.addEventListener('change', () => invalidate());

const sheet = initSheet(drawer, grabber, (snap) => {
  app.dataset.snap = snap;
  syncPanelAccess(snap);
  updateLayout();
});

/** Content clipped away in the phone peek state must not take keyboard focus. */
function syncPanelAccess(snap: string): void {
  tabPanelsEl.inert = !sidePanelQuery.matches && snap === 'peek';
}

new ResizeObserver(() => updateLayout()).observe(drawer);

camera.position
  .copy(HOME_TARGET)
  .addScaledVector(HOME_POSITION.clone().sub(HOME_TARGET), framingScale());
controls.update();

buildUi();
setTheme(initialTheme);
setTab('steps');
syncControls();
updateModeButtons();
updateStepper();
setDrawerOpen(state.drawerOpen);
applyVisibility();
updateLayout(true);

const initial = readUrlState(STEPS.length);
if (initial.step !== undefined) {
  goToStep(initial.step);
} else if (initial.mode) {
  setMode(initial.mode);
}
if (initial.part && initial.step === undefined) {
  const part = device.partById.get(initial.part);
  if (part) {
    selectPart(part, true);
  }
}

const timer = new THREE.Timer();
let firstFrame = true;

function render(time: number): void {
  requestAnimationFrame(render);
  if (document.hidden) {
    return;
  }

  timer.update(time);
  const dt = Math.min(timer.getDelta(), 0.05);
  let animating = false;

  if (Math.abs(state.explodeTarget - state.explode) > 0.0005) {
    state.explode = reduceMotion.matches
      ? state.explodeTarget
      : state.explode + (state.explodeTarget - state.explode) * Math.min(1, dt * 6.5);
    applyExplode();
    animating = true;
  } else if (state.explode !== state.explodeTarget) {
    state.explode = state.explodeTarget;
    applyExplode();
    animating = true;
  }

  if (cameraTween) {
    cameraTween.t = Math.min(1, cameraTween.t + dt * 2.6);
    const eased = 1 - Math.pow(1 - cameraTween.t, 3);
    camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
    if (cameraTween.t >= 1) {
      cameraTween = null;
    }
    animating = true;
  }

  const dx = viewTarget.x - viewOffset.x;
  const dy = viewTarget.y - viewOffset.y;
  if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
    const k = 1 - Math.exp(-dt * 9);
    viewOffset.x += dx * k;
    viewOffset.y += dy * k;
    applyViewOffset();
    animating = true;
  } else if (dx !== 0 || dy !== 0) {
    viewOffset.x = viewTarget.x;
    viewOffset.y = viewTarget.y;
    applyViewOffset();
    animating = true;
  }

  const moved = controls.update();

  if (!animating && !moved && framesNeeded <= 0) {
    return;
  }
  framesNeeded = animating ? 2 : Math.max(0, framesNeeded - 1);

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
    showHint();
  }
}

requestAnimationFrame(render);
