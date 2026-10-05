import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { HeatMapModel, PaletteId } from '../types/heatmap';
import { PALETTES } from '../constants/palettes';
import { WidgetConfig } from './widgetStorage';

interface TrackHeatWidgetProps {
  map?: HeatMapModel;
  config?: WidgetConfig;
  width: number;
  height: number;
  isDark?: boolean;
}

export function TrackHeatWidget({ map, config, width, height, isDark = true }: TrackHeatWidgetProps) {
  let effectiveDark = isDark;
  if (config?.theme === 'dark') effectiveDark = true;
  if (config?.theme === 'light') effectiveDark = false;

  const bg = effectiveDark ? '#0D1117' : '#FFFFFF';
  const border = effectiveDark ? '#30363D' : '#E1E4E8';
  const textPrimary = effectiveDark ? '#F0F3F6' : '#1F2328';
  const cellEmpty = effectiveDark ? '#161B22' : '#EBEDF0';

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
            color: effectiveDark ? '#8B949E' : '#656D76',
          }}
        />
      </FlexWidget>
    );
  }

  // Display Name: alias if set, otherwise original title
  const displayTitle = config?.customName?.trim() || map.title;

  // Palette: custom palette if set, otherwise map palette
  const activePaletteId = (config?.paletteId || map.paletteId) as PaletteId;
  const palette = PALETTES[activePaletteId] || PALETTES.emerald;
  const activeColor = effectiveDark
    ? ((palette.levels[3] || palette.accent) as `#${string}`)
    : ((palette.lightLevels?.[3] || palette.accent) as `#${string}`);

  // Layout sizing
  const isSingleRow = height < 95;
  const isCompactWidth = width < 260; // 2 or 3 wide
  
  // Tight padding to maximize matrix area
  const paddingV = isSingleRow ? 4 : 8;
  const paddingH = isSingleRow ? 6 : 10;
  const headerMargin = isSingleRow ? 3 : 5;

  // Habit title font size
  const titleFontSize = isSingleRow
    ? Math.min(13, Math.max(10, Math.floor(width / 22)))
    : Math.min(16, Math.max(12, Math.floor(width / 18)));

  // Available vertical space for 7 matrix rows - stretched to fullest
  const availableGridHeight = Math.max(28, height - paddingV * 2 - headerMargin - titleFontSize - 3);
  const minGapY = isSingleRow ? 1.5 : 2;
  const rawCellSize = Math.floor((availableGridHeight - minGapY * 6) / 7);
  const cellSize = isSingleRow
    ? Math.min(7.5, Math.max(4.5, rawCellSize))
    : Math.min(14, Math.max(8.5, rawCellSize));

  // Available horizontal space for week columns - stretched edge-to-edge
  const availableWidth = width - paddingH * 2;
  const minGapX = isSingleRow ? 1.5 : 2.5;
  const numWeeks = Math.max(5, Math.floor((availableWidth + minGapX) / (cellSize + minGapX)));

  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Mon = 0, Sun = 6
  const totalDays = numWeeks * 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));

  const columns: Array<Array<{ key: string; color: string }>> = [];
  let cur = new Date(startDate);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let w = 0; w < numWeeks; w++) {
    const col: Array<{ key: string; color: string }> = [];
    for (let d = 0; d < 7; d++) {
      const curMidnight = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
      const isFuture = curMidnight > todayMidnight;

      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      const day = String(cur.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      const entry = map.entries?.[key];
      const isCompleted = !isFuture && Boolean(entry?.completed);

      // Future days do NOT display an empty box (transparent placeholder)
      col.push({
        key,
        color: isFuture ? 'transparent' : (isCompleted ? activeColor : cellEmpty),
      });
      cur.setDate(cur.getDate() + 1);
    }
    columns.push(col);
  }

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isTodayDone = Boolean(map.entries?.[todayKey]?.completed);

  // In small layout (2, 3 wide), show only '+' or '✓' to leave max space for habit name
  const logButtonText = isCompactWidth
    ? (isTodayDone ? '✓' : '+')
    : (isTodayDone ? '✓ Done' : '+ Log');

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
      {/* Top Header: Habit Title + Today Toggle Button */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
          marginBottom: headerMargin,
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            marginRight: 6,
          }}
        >
          <TextWidget
            text={displayTitle}
            maxLines={1}
            truncate="END"
            style={{
              fontSize: titleFontSize,
              fontWeight: 'bold',
              color: textPrimary,
            }}
          />
        </FlexWidget>

        {/* Small Log Today Button */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: isCompactWidth ? 6 : 8,
            paddingVertical: isSingleRow ? 1.5 : 3,
            borderRadius: isCompactWidth ? 10 : 8,
            backgroundColor: isTodayDone
              ? (effectiveDark ? '#238636' : '#2EA043')
              : (effectiveDark ? '#21262D' : '#F0F2F5'),
            borderColor: isTodayDone
              ? (effectiveDark ? '#2EA043' : '#238636')
              : (effectiveDark ? '#30363D' : '#D0D7DE'),
            borderWidth: 1,
          }}
          clickAction="TOGGLE_TODAY"
          clickActionData={{ habitId: map.id }}
          accessibilityLabel={isTodayDone ? `Mark ${displayTitle} not done` : `Mark ${displayTitle} done today`}
        >
          <TextWidget
            text={logButtonText}
            style={{
              fontSize: isSingleRow ? (isCompactWidth ? 11 : 9) : (isCompactWidth ? 12 : 10),
              fontWeight: 'bold',
              color: isTodayDone ? '#FFFFFF' : textPrimary,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Contribution Grid: Stretched edge-to-edge horizontally and vertically */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        {columns.map((col, colIdx) => (
          <FlexWidget
            key={`col-${colIdx}`}
            style={{
              flexDirection: 'column',
            }}
          >
            {col.map((cell) => (
              <FlexWidget
                key={cell.key}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: isSingleRow ? 1 : 2,
                  backgroundColor: cell.color as any,
                  marginVertical: minGapY / 2,
                }}
              />
            ))}
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
