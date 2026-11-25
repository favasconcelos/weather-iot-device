import type { Mode, PartId } from './types';

const MODES: readonly Mode[] = ['assembled', 'exploded', 'wiring', 'print'];
const PARTS: readonly PartId[] = [
  'xiao',
  'hat',
  'battery',
  'box',
  'lid',
  'shield',
  'led',
  'reed',
  'wires',
];

export interface UrlState {
  mode?: Mode;
  part?: PartId;
  step?: number;
}

/**
 * Reads the view from the address hash, ignoring anything it does not know.
 */
export function readUrlState(stepCount: number): UrlState {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const state: UrlState = {};

  const mode = params.get('mode');
  if (mode && (MODES as readonly string[]).includes(mode)) {
    state.mode = mode as Mode;
  }

  const part = params.get('part');
  if (part && (PARTS as readonly string[]).includes(part)) {
    state.part = part as PartId;
  }

  const step = Number(params.get('step'));
  if (params.has('step') && Number.isInteger(step) && step >= 1 && step <= stepCount) {
    state.step = step - 1;
  }

  return state;
}

/**
 * Writes the view to the address hash so it can be shared. Steps are 1-based.
 */
export function writeUrlState(state: UrlState): void {
  const params = new URLSearchParams();
  if (state.mode) {
    params.set('mode', state.mode);
  }
  if (state.part) {
    params.set('part', state.part);
  }
  if (state.step !== undefined && state.step >= 0) {
    params.set('step', String(state.step + 1));
  }
  const hash = params.toString();
  const next = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ''}`;
  window.history.replaceState(null, '', next);
}
