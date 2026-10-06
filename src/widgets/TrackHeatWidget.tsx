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
          borderRadius: 12,
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
  // height < 95 means 1 row (compact, ~55-80dp)
  // height >= 95 means 2 rows or more (~110-135dp)
  const isSingleRow = height < 95;

  // Single row sizing (height 1: no header title, vertical button on right)
  const paddingV = isSingleRow ? 6 : 8;
  const paddingH = isSingleRow ? 8 : 10;
  const btnWidth = 22;
  const btnMarginLeft = 8;

  // Height 2 sizing (header with top-left button + habit title, full-width matrix below)
  const btnSize = 20;
  const headerMarginBottom = 6;
  const headerHeight = btnSize;
  const titleFontSize = Math.min(14, Math.max(11, Math.floor(width / 22)));

  // Available vertical space for 7 matrix rows (Monday to Sunday)
  const availableGridHeight = isSingleRow
    ? Math.max(28, height - paddingV * 2)
    : Math.max(28, height - paddingV * 2 - headerHeight - headerMarginBottom);

  const gapY = isSingleRow ? 1.5 : 2;
  const rawCellSize = Math.floor((availableGridHeight - gapY * 6) / 7);
  const cellSize = isSingleRow
    ? Math.min(8, Math.max(4, rawCellSize))
    : Math.min(13, Math.max(5.5, rawCellSize));

  // The exact grid height of the 7 rows
  const gridHeight = cellSize * 7 + gapY * 6;

  // Available horizontal space for week columns
  const availableWidth = isSingleRow
    ? Math.max(40, width - paddingH * 2 - btnWidth - btnMarginLeft)
    : Math.max(40, width - paddingH * 2);

  const gapX = isSingleRow ? 1.5 : 2;
  const numWeeks = isSingleRow
    ? Math.max(3, Math.floor((availableWidth + gapX) / (cellSize + gapX)))
    : Math.max(4, Math.floor((availableWidth + gapX) / (cellSize + gapX)));

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

  // Height 1 layout: No title, 7-row matrix on left, vertical toggle pill on right
  if (isSingleRow) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: bg,
          borderRadius: 12,
          borderColor: border,
          borderWidth: 1,
          paddingTop: paddingV,
          paddingBottom: paddingV,
          paddingLeft: paddingH,
          paddingRight: paddingH,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        clickAction="OPEN_APP"
      >
        {/* 1. Contribution Matrix */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: gridHeight,
            flex: 1,
          }}
        >
          {columns.map((col, colIdx) => (
            <FlexWidget
              key={`col-${colIdx}`}
              style={{
                flexDirection: 'column',
                marginRight: colIdx === columns.length - 1 ? 0 : gapX,
              }}
            >
              {col.map((cell, dIdx) => (
                <FlexWidget
                  key={cell.key}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: 1,
                    backgroundColor: cell.color as any,
                    marginTop: dIdx === 0 ? 0 : gapY,
                  }}
                />
              ))}
            </FlexWidget>
          ))}
        </FlexWidget>

        {/* 2. Vertical Action / Log Today Button on Very Right */}
        <FlexWidget
          style={{
            width: btnWidth,
            height: gridHeight,
            borderRadius: Math.floor(btnWidth / 2),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: toggleBtnBg as `#${string}`,
            borderColor: toggleBtnBorder as `#${string}`,
            borderWidth: 1,
            marginLeft: btnMarginLeft,
          }}
          clickAction="TOGGLE_TODAY"
          clickActionData={{ habitId: map.id }}
          accessibilityLabel={isTodayDone ? `Mark ${displayTitle} not done` : `Mark ${displayTitle} done today`}
        >
          <TextWidget
            text={isTodayDone ? '✓' : '+'}
            maxLines={1}
            style={{
              width: btnWidth,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 'bold',
              color: toggleBtnTextColor as `#${string}`,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    );
  }

  // Height 2 layout: Top-left log button + habit title header, full-width 7-row matrix below
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: bg,
        borderRadius: 12,
        borderColor: border,
        borderWidth: 1,
        paddingTop: paddingV,
        paddingBottom: paddingV,
        paddingLeft: paddingH,
        paddingRight: paddingH,
        flexDirection: 'column',
        justifyContent: 'flex-start',
      }}
      clickAction="OPEN_APP"
    >
      {/* 1. Header Row: Log Button on Left Top + Habit Name */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: 'match_parent',
          height: headerHeight,
          marginBottom: headerMarginBottom,
        }}
      >
        {/* Log Today Button on Left Top */}
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
            marginRight: 8,
          }}
          clickAction="TOGGLE_TODAY"
          clickActionData={{ habitId: map.id }}
          accessibilityLabel={isTodayDone ? `Mark ${displayTitle} not done` : `Mark ${displayTitle} done today`}
        >
          <TextWidget
            text={isTodayDone ? '✓' : '+'}
            maxLines={1}
            style={{
              width: btnSize,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 'bold',
              color: toggleBtnTextColor as `#${string}`,
            }}
          />
        </FlexWidget>

        {/* Habit Name right next to button */}
        <FlexWidget
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
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
      </FlexWidget>

      {/* 2. Contribution Matrix: 7 rows stretched edge-to-edge */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: gridHeight,
          width: 'match_parent',
        }}
      >
        {columns.map((col, colIdx) => (
          <FlexWidget
            key={`col-${colIdx}`}
            style={{
              flexDirection: 'column',
              marginRight: colIdx === columns.length - 1 ? 0 : gapX,
            }}
          >
            {col.map((cell, dIdx) => (
              <FlexWidget
                key={cell.key}
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 2,
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
