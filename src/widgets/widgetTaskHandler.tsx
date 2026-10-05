import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { TrackHeatWidget } from './TrackHeatWidget';
import { getHabitForWidget, toggleHabitToday } from './widgetStorage';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps): Promise<void> {
  const { widgetInfo, widgetAction, renderWidget, clickAction, clickActionData } = props;

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
    case 'WIDGET_CLICK': {
      if (clickAction === 'TOGGLE_TODAY') {
        const habitId = clickActionData?.habitId as string;
        if (habitId) {
          await toggleHabitToday(habitId);
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
        }
      }
      break;
    }
    case 'WIDGET_DELETED':
    default:
      break;
  }
}
