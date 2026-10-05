import React from 'react';
import { Platform } from 'react-native';
import { TrackHeatWidget } from './TrackHeatWidget';
import { getHabitForWidget } from './widgetStorage';

export async function updateAndroidWidgets(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');

    await requestWidgetUpdate({
      widgetName: 'TrackHeatWidget',
      renderWidget: async (widgetInfo: any) => {
        const habit = await getHabitForWidget(widgetInfo.widgetId);
        return {
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
        };
      },
    });
  } catch (err) {
    // If widget is not installed on home screen, silently pass
  }
}
