import { HeatMapModel } from '../types/heatmap';
import { formatDateKey } from '../utils/dateUtils';

function generateSampleEntries(
  daysBack: number,
  density: number,
  maxValue: number = 1
): HeatMapModel['entries'] {
  const entries: HeatMapModel['entries'] = {};
  const today = new Date();

  // Seeded pseudo-randomness for deterministic pleasing heatmap
  let seed = 42;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let i = daysBack; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = formatDateKey(d);

    // Give higher activity in recent 30 days
    const boost = i < 30 ? 0.2 : 0;
    if (pseudoRandom() < density + boost) {
      const val = maxValue === 1 ? 1 : Math.floor(pseudoRandom() * maxValue) + 1;
      entries[key] = {
        date: key,
        value: val,
      };
    }
  }

  // Ensure yesterday and today have entries for a live streak
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  entries[formatDateKey(yesterday)] = {
    date: formatDateKey(yesterday),
    value: maxValue === 1 ? 1 : maxValue,
  };
  entries[formatDateKey(today)] = {
    date: formatDateKey(today),
    value: maxValue === 1 ? 1 : maxValue,
  };

  return entries;
}

export const SAMPLE_HEATMAPS: HeatMapModel[] = [
  {
    id: 'hm-fitness-strength',
    title: 'Strength Training',
    description: 'Hypertrophy and progressive overload sessions',
    category: 'Fitness',
    unitType: 'duration',
    unitLabel: 'mins',
    targetValue: 60,
    paletteId: 'emerald',
    createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
    entries: generateSampleEntries(220, 0.65, 75),
  },
  {
    id: 'hm-diet-clean',
    title: 'Clean Nutrition & Macros',
    description: 'Hit caloric deficit and zero processed sugar',
    category: 'Dieting',
    unitType: 'boolean',
    targetValue: 1,
    paletteId: 'amber',
    createdAt: new Date(Date.now() - 150 * 24 * 3600 * 1000).toISOString(),
    entries: generateSampleEntries(160, 0.72, 1),
  },
  {
    id: 'hm-deep-work',
    title: 'Deep Engineering Focus',
    description: 'Uninterrupted 90-minute technical architecture blocks',
    category: 'Productivity',
    unitType: 'count',
    unitLabel: 'blocks',
    targetValue: 3,
    paletteId: 'obsidian',
    createdAt: new Date(Date.now() - 240 * 24 * 3600 * 1000).toISOString(),
    entries: generateSampleEntries(240, 0.58, 4),
  },
  {
    id: 'hm-hydration-steps',
    title: '10k Daily Steps',
    description: 'Cardiovascular baseline movement',
    category: 'Health',
    unitType: 'count',
    unitLabel: 'steps',
    targetValue: 10000,
    paletteId: 'cyan',
    createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
    entries: generateSampleEntries(120, 0.8, 12000),
  },
];
