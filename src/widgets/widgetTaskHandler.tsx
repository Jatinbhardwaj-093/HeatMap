import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { TrackHeatWidget } from './TrackHeatWidget';
import { getHabitForWidget } from './widgetStorage';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetInfo, widgetAction, renderWidget } = props;

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const habit = await getHabitForWidget(widgetInfo.widgetId);

      renderWidget({
        light: (
          <TrackHeatWidget
            map={habit}
            width={widgetInfo.width}
            height={widgetInfo.height}
            isDark={false}
          />
        ),
        dark: (
          <TrackHeatWidget
            map={habit}
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
