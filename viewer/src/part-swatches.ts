import type { PartId } from './types';

/**
 * Small colour chips for the Parts list. They hint at what each part looks
 * like, lightened where the real part is black so it stays visible on dark.
 */
export const PART_SWATCH: Record<PartId, string> = {
  xiao: 'linear-gradient(135deg, #46b97a, #1f6b3f)',
  hat: 'linear-gradient(135deg, #9aa7b6, #3b4552)',
  battery: 'linear-gradient(135deg, #4aa0ff, #1e5fb8)',
  led: 'linear-gradient(135deg, #7be8a6, #2fbf71)',
  reed: 'linear-gradient(135deg, #e3e8ed, #98a3ae)',
  wires:
    'conic-gradient(from 20deg, #e53935, #fb8c00, #43a047, #8e24aa, #e53935)',
  box: 'linear-gradient(135deg, #f4f6f5, #b9c4cc)',
  lid: 'linear-gradient(135deg, #e8eeee, #a9b6bd)',
  shield: 'linear-gradient(135deg, #fbfaf3, #cfcab8)',
};
