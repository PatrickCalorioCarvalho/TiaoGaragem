import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './src/widgets/widgetTaskHandler';
import 'expo-router/entry';

registerWidgetTaskHandler(widgetTaskHandler);
