import React from 'react';
import { Platform } from 'react-native';
import { TrackHeatWidget } from './TrackHeatWidget';
import { getWidgetHabits } from './widgetStorage';

export async function updateAndroidWidgets(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const habits = await getWidgetHabits();
    const primaryHabit = habits[0];

    await requestWidgetUpdate({
      widgetName: 'TrackHeatWidget',
      renderWidget: (widgetInfo: any) => ({
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
      }),
    });
  } catch (err) {
    // If widget is not installed on home screen, silently pass
  }
}
