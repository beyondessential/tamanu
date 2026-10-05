import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';

export const useDisableAndroidBackButton = (enabled = true): void => {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) {
        return;
      }

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, [enabled]),
  );
};
