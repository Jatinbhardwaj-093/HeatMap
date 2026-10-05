import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

if (Platform.OS === 'android') {
  try {
    const { registerWidgetTaskHandler, registerWidgetConfigurationScreen } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./src/widgets/widgetTaskHandler');
    const { WidgetConfigurationScreen } = require('./src/widgets/WidgetConfigurationScreen');
    registerWidgetTaskHandler(widgetTaskHandler);
    registerWidgetConfigurationScreen(WidgetConfigurationScreen);
  } catch (err) {
    console.warn('Widget task registration error:', err);
  }
}

registerRootComponent(App);
