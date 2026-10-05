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
  
  // Compact padding to give maximum room for the 7 rows
  const paddingV = isSingleRow ? 4 : 6;
  const paddingH = isSingleRow ? 6 : 8;
  const headerMargin = isSingleRow ? 2 : 4;

  // Circular button dimensions
  const btnSize = isSingleRow ? 18 : 20;

  // Habit title font size
  const titleFontSize = isSingleRow
    ? Math.min(12, Math.max(10, Math.floor(width / 24)))
    : Math.min(14, Math.max(11, Math.floor(width / 20)));

  const headerHeight = Math.max(btnSize, titleFontSize + 2);

  // Available vertical space for 7 matrix rows - strictly measured so Sunday never clips
  const availableGridHeight = Math.max(28, height - paddingV * 2 - headerHeight - headerMargin - 4);
  const gapY = isSingleRow ? 1 : 2;
  const rawCellSize = Math.floor((availableGridHeight - gapY * 6) / 7);
  const cellSize = isSingleRow
    ? Math.min(7, Math.max(4, rawCellSize))
    : Math.min(12, Math.max(6, rawCellSize));

  // Available horizontal space for week columns
  const availableWidth = width - paddingH * 2;
  const gapX = isSingleRow ? 1.5 : 2;
  const numWeeks = Math.max(4, Math.floor((availableWidth + gapX) / (cellSize + gapX)));

  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Mon = 0, Sun = 6
  const totalDays = numWeeks * 7;
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (totalDays - 1 - (6 - dayOfWeek)));

  // Transparent ARGB hex for Android RemoteViews (prevents white square fallback)
  const COLOR_TRANSPARENT = '#00000000';

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

      // Future days are completely transparent with 00 alpha
      col.push({
        key,
        color: isFuture ? COLOR_TRANSPARENT : (isCompleted ? activeColor : cellEmpty),
      });
      cur.setDate(cur.getDate() + 1);
    }
    columns.push(col);
  }

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isTodayDone = Boolean(map.entries?.[todayKey]?.completed);

  const isObsidian = activePaletteId === 'obsidian';
  const toggleBtnBg = isTodayDone
    ? (effectiveDark
        ? (isObsidian ? '#F0F3F6' : (palette.levels[3] || palette.accent))
        : (isObsidian ? '#24292F' : (palette.lightLevels?.[3] || palette.accent)))
    : (effectiveDark ? '#21262D' : '#F0F2F5');

  const toggleBtnBorder = isTodayDone
    ? (effectiveDark
        ? (isObsidian ? '#F0F3F6' : (palette.levels[4] || palette.accent))
        : (isObsidian ? '#24292F' : (palette.lightLevels?.[4] || palette.accent)))
    : (effectiveDark ? '#30363D' : '#D0D7DE');

  const toggleBtnTextColor = isTodayDone
    ? (effectiveDark && isObsidian ? '#090A0C' : '#FFFFFF')
    : textPrimary;

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
      {/* Top Header: Habit Title + Circular Today Toggle Button */}
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

        {/* Circular Log Today Button */}
        <FlexWidget
          style={{
            width: btnSize,
            height: btnSize,
            borderRadius: Math.floor(btnSize / 2),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: toggleBtnBg as `#${string}`,
            borderColor: toggleBtnBorder as `#${string}`,
            borderWidth: 1,
          }}
          clickAction="TOGGLE_TODAY"
          clickActionData={{ habitId: map.id }}
          accessibilityLabel={isTodayDone ? `Mark ${displayTitle} not done` : `Mark ${displayTitle} done today`}
        >
          <TextWidget
            text={isTodayDone ? '✓' : '+'}
            style={{
              fontSize: isSingleRow ? 9 : 11,
              fontWeight: 'bold',
              color: toggleBtnTextColor as `#${string}`,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Contribution Grid: Stretched cleanly with exact 7-row height */}
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
            {col.map((cell, dIdx) => (
              <FlexWidget
                key={cell.key}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: isSingleRow ? 1 : 2,
                  backgroundColor: cell.color as any,
                  marginTop: dIdx === 0 ? 0 : gapY,
                }}
              />
            ))}
          </FlexWidget>
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
