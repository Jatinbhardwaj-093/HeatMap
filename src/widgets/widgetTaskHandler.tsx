import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { TrackHeatWidget } from './TrackHeatWidget';
import { getWidgetHabits } from './widgetStorage';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetInfo, widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const habits = await getWidgetHabits();
      const primaryHabit = habits[0];

      renderWidget({
        light: (
          <TrackHeatWidget
            map={primaryHabit}
            width={widgetInfo.width}
            height={widgetInfo.height}
            isDark={false}
          />
        ),
        dark: (
          <TrackHeatWidget
            map={primaryHabit}
            width={widgetInfo.width}
            height={widgetInfo.height}
            isDark={true}
          />
        ),
      });
      break;
    }
    case 'WIDGET_DELETED':
    case 'WIDGET_CLICK':
    default:
      break;
  }
}
