import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { HeatMapModel } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { calculateStats } from '../utils/streakUtils';

interface TrackHeatWidgetProps {
  map?: HeatMapModel;
  width: number;
  height: number;
  isDark?: boolean;
}

export function TrackHeatWidget({ map, width, height, isDark = true }: TrackHeatWidgetProps) {
  const bg = isDark ? '#0D1117' : '#FFFFFF';
  const border = isDark ? '#30363D' : '#E1E4E8';
  const textPrimary = isDark ? '#F0F3F6' : '#1F2328';
  const textMuted = isDark ? '#8B949E' : '#656D76';
  const cellEmpty = isDark ? '#161B22' : '#EBEDF0';

  if (!map) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: bg,
          borderRadius: 18,
          borderColor: border,
          borderWidth: 1,
          padding: 16,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text="TrackHeat"
          style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: textPrimary,
            marginBottom: 6,
          }}
        />
        <TextWidget
          text="Tap to open app & create habit"
          style={{
            fontSize: 12,
            color: textMuted,
          }}
        />
      </FlexWidget>
    );
  }

  const { stats } = calculateStats(map);
  const palette = PALETTES[map.paletteId] || PALETTES.emerald;
  const activeColor = isDark
    ? ((palette.levels[3] || palette.accent) as `#${string}`)
    : ((palette.lightLevels?.[3] || palette.accent) as `#${string}`);

  const isSmall = width < 230;
  const numWeeks = isSmall ? 8 : width < 310 ? 14 : 19;
  const isCompactHeight = height < 125;
  const cellSize = isSmall ? (isCompactHeight ? 9 : 11) : (isCompactHeight ? 9 : 10.5);
  const cellGap = 2.5;

  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const totalDays = numWeeks * 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));

  const columns: Array<Array<{ key: string; color: `#${string}` }>> = [];
  let cur = new Date(startDate);

  for (let w = 0; w < numWeeks; w++) {
    const col: Array<{ key: string; color: `#${string}` }> = [];
    for (let d = 0; d < 7; d++) {
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      const day = String(cur.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      const entry = map.entries?.[key];
      const isFuture = cur > today;
      const isCompleted = !isFuture && Boolean(entry?.completed);

      col.push({
        key,
        color: isCompleted ? activeColor : (cellEmpty as `#${string}`),
      });
      cur.setDate(cur.getDate() + 1);
    }
    columns.push(col);
  }

  const streakText = stats.currentStreak > 0 ? `${stats.currentStreak}d streak` : 'TrackHeat';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: bg,
        borderRadius: 18,
        borderColor: border,
        borderWidth: 1,
        padding: 12,
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          marginBottom: 8,
        }}
      >
        <TextWidget
          text={map.title}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: textPrimary,
          }}
        />
        <TextWidget
          text={streakText}
          style={{
            fontSize: 11,
            color: textMuted,
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        {columns.map((col, colIdx) => (
          <FlexWidget
            key={`col-${colIdx}`}
            style={{
              flexDirection: 'column',
              marginHorizontal: cellGap / 2,
            }}
          >
            {col.map((cell) => (
              <FlexWidget
                key={cell.key}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 2,
                  backgroundColor: cell.color,
                  marginVertical: cellGap / 2,
                }}
              />
            ))}
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
