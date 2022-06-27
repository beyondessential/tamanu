import { Platform } from 'react-native';

export const isAndroid = (): boolean => Platform.OS === 'android';

export const isIOS = (): boolean => Platform.OS === 'ios';
