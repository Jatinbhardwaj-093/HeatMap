import { HeatMapModel } from '../types/heatmap';
import { formatDateKey } from '../utils/dateUtils';

function generateSampleEntries(
  daysBack: number,
  density: number
): HeatMapModel['entries'] {
  const entries: HeatMapModel['entries'] = {};
  const today = new Date();

  let seed = 42;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let i = daysBack; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDateKey(d);

    const boost = i < 30 ? 0.2 : 0;
    if (pseudoRandom() < density + boost) {
      entries[key] = {
        date: key,
        completed: true,
      };
    }
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  entries[formatDateKey(yesterday)] = {
    date: formatDateKey(yesterday),
    completed: true,
  };
  entries[formatDateKey(today)] = {
    date: formatDateKey(today),
    completed: true,
  };

  return entries;
}

export const SAMPLE_HEATMAPS: HeatMapModel[] = [
  {
    id: 'hm-fitness-strength',
    title: 'Strength Training',
    description: 'Hypertrophy and progressive overload sessions',
    category: 'Fitness',
    paletteId: 'emerald',
    createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
    entries: generateSampleEntries(220, 0.65),
  },
  {
    id: 'hm-diet-clean',
    title: 'Clean Nutrition & Macros',
    description: 'Hit caloric deficit and zero processed sugar',
    category: 'Dieting',
    paletteId: 'amber',
    createdAt: new Date(Date.now() - 150 * 24 * 3600 * 1000).toISOString(),
    entries: generateSampleEntries(160, 0.72),
  },
  {
    id: 'hm-deep-work',
    title: 'Deep Engineering Focus',
    description: 'Uninterrupted 90-minute technical architecture blocks',
    category: 'Productivity',
    paletteId: 'obsidian',
    createdAt: new Date(Date.now() - 240 * 24 * 3600 * 1000).toISOString(),
    entries: generateSampleEntries(240, 0.58),
  },
  {
    id: 'hm-hydration-steps',
    title: '10k Daily Steps',
    description: 'Cardiovascular baseline movement',
    category: 'Health',
    paletteId: 'cyan',
    createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
    entries: generateSampleEntries(120, 0.8),
  },
];
