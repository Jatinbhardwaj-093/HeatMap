import { ColorPalette, PaletteId } from '../types/heatmap';

export const PALETTES: Record<PaletteId, ColorPalette> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Matrix',
    levels: [
      '#161B22', // empty
      '#0E4429', // level 1
      '#006D32', // level 2
      '#26A641', // level 3
      '#39D353', // level 4
    ],
    accent: '#26A641',
  },
  amber: {
    id: 'amber',
    name: 'Industrial Amber',
    levels: [
      '#1A1713', // empty
      '#43280B', // level 1
      '#78470E', // level 2
      '#B45309', // level 3
      '#F59E0B', // level 4
    ],
    accent: '#F59E0B',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Mono',
    levels: [
      '#18191D', // empty
      '#2D3139', // level 1
      '#4F5666', // level 2
      '#8B949E', // level 3
      '#F0F3F6', // level 4
    ],
    accent: '#F0F3F6',
  },
  cyan: {
    id: 'cyan',
    name: 'Cold Cyan',
    levels: [
      '#111923', // empty
      '#0C384D', // level 1
      '#0E5D7F', // level 2
      '#0284C7', // level 3
      '#38BDF8', // level 4
    ],
    accent: '#38BDF8',
  },
  crimson: {
    id: 'crimson',
    name: 'Oxide Crimson',
    levels: [
      '#1D1214', // empty
      '#4C131A', // level 1
      '#7F1D1D', // level 2
      '#DC2626', // level 3
      '#F87171', // level 4
    ],
    accent: '#DC2626',
  },
};

export const DEFAULT_PALETTE_ID: PaletteId = 'emerald';
