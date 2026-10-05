import { ColorPalette, PaletteId } from '../types/heatmap';

export const PALETTES: Record<PaletteId, ColorPalette> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    levels: [
      'rgba(255, 255, 255, 0.04)', // empty (ultra-light, no dark block)
      '#196127', // level 1 (clear distinct green)
      '#238636', // level 2
      '#2EA043', // level 3
      '#39D353', // level 4
    ],
    lightLevels: [
      'rgba(0, 0, 0, 0.035)', // empty (ultra-light whisper)
      '#9BE9A8', // level 1 (crisp light green)
      '#40C463', // level 2
      '#30A14E', // level 3
      '#216E39', // level 4
    ],
    accent: '#2EA043',
  },
  amber: {
    id: 'amber',
    name: 'Industrial Amber',
    levels: [
      'rgba(255, 255, 255, 0.04)', // empty
      '#5E3008', // level 1
      '#854D0E', // level 2
      '#B45309', // level 3
      '#F59E0B', // level 4
    ],
    lightLevels: [
      'rgba(0, 0, 0, 0.035)', // empty
      '#FDE68A', // level 1
      '#FBBF24', // level 2
      '#D97706', // level 3
      '#92400E', // level 4
    ],
    accent: '#F59E0B',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Mono',
    levels: [
      'rgba(255, 255, 255, 0.04)', // empty
      '#30363D', // level 1
      '#4F5666', // level 2
      '#8B949E', // level 3
      '#F0F3F6', // level 4
    ],
    lightLevels: [
      'rgba(0, 0, 0, 0.035)', // empty
      '#D0D7DE', // level 1
      '#8C959F', // level 2
      '#57606A', // level 3
      '#24292F', // level 4
    ],
    accent: '#F0F3F6',
  },
  cyan: {
    id: 'cyan',
    name: 'Cold Cyan',
    levels: [
      'rgba(255, 255, 255, 0.04)', // empty
      '#0E4E6B', // level 1
      '#0369A1', // level 2
      '#0284C7', // level 3
      '#38BDF8', // level 4
    ],
    lightLevels: [
      'rgba(0, 0, 0, 0.035)', // empty
      '#BAE6FD', // level 1
      '#38BDF8', // level 2
      '#0284C7', // level 3
      '#0369A1', // level 4
    ],
    accent: '#38BDF8',
  },
  crimson: {
    id: 'crimson',
    name: 'Oxide Crimson',
    levels: [
      'rgba(255, 255, 255, 0.04)', // empty
      '#5C151F', // level 1
      '#991B1B', // level 2
      '#DC2626', // level 3
      '#F87171', // level 4
    ],
    lightLevels: [
      'rgba(0, 0, 0, 0.035)', // empty
      '#FECACA', // level 1
      '#F87171', // level 2
      '#DC2626', // level 3
      '#991B1B', // level 4
    ],
    accent: '#DC2626',
  },
};

export const DEFAULT_PALETTE_ID: PaletteId = 'emerald';
