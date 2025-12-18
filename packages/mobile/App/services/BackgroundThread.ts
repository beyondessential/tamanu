import { NativeModules } from 'react-native';

const { BackgroundThread } = NativeModules;

export const runOnBackgroundThread = (callback: () => void): void => {
  if (!BackgroundThread) {
    console.warn('BackgroundThread native module not available, running on main thread');
    callback();
    return;
  }
  
  BackgroundThread.runOnBackgroundThread(callback);
};

