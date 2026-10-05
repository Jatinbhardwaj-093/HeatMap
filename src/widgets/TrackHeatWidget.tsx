import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { HeatMapModel } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';

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
          padding: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text="TrackHeat"
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: textPrimary,
            marginBottom: 4,
          }}
        />
        <TextWidget
          text="Tap to open app & select habit"
          style={{
            fontSize: 11,
            color: textMuted,
          }}
        />
      </FlexWidget>
    );
  }

  const palette = PALETTES[map.paletteId] || PALETTES.emerald;
  const activeColor = isDark
    ? ((palette.levels[3] || palette.accent) as `#${string}`)
    : ((palette.lightLevels?.[3] || palette.accent) as `#${string}`);

  // Responsive scaling based on dimensions
  const isSingleRow = height < 95;
  const paddingV = isSingleRow ? 7 : 10;
  const paddingH = isSingleRow ? 9 : 12;
  const headerMargin = isSingleRow ? 3 : 6;

  // Habit title font size adjusts with width and height
  const titleFontSize = isSingleRow
    ? Math.min(12, Math.max(9, Math.floor(width / 26)))
    : Math.min(15, Math.max(11, Math.floor(width / 22)));

  // Matrix cell size adjusts dynamically with height
  const cellGap = isSingleRow ? 1.5 : 2.5;
  const availableGridHeight = Math.max(28, height - paddingV * 2 - headerMargin - titleFontSize - 3);
  const rawCellSize = (availableGridHeight - cellGap * 6) / 7;
  const cellSize = isSingleRow
    ? Math.min(7, Math.max(4, rawCellSize))
    : Math.min(12.5, Math.max(7.5, rawCellSize));

  // Week columns dynamically adjust to fill width
  const availableWidth = width - paddingH * 2;
  const stepX = cellSize + cellGap;
  const numWeeks = Math.max(4, Math.min(30, Math.floor((availableWidth + cellGap) / stepX)));

  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Mon = 0, Sun = 6
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

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: bg,
        borderRadius: 18,
        borderColor: border,
        borderWidth: 1,
        paddingTop: paddingV,
        paddingBottom: paddingV,
        paddingLeft: paddingH,
        paddingRight: paddingH,
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* Top Header: Habit title only (streak count removed) */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          width: 'match_parent',
          marginBottom: headerMargin,
        }}
      >
        <TextWidget
          text={map.title}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: titleFontSize,
            fontWeight: 'bold',
            color: textPrimary,
          }}
        />
      </FlexWidget>

      {/* Contribution Grid: dynamic cell size and dynamic week columns */}
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
                  borderRadius: isSingleRow ? 1 : 2,
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
