import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';

export const useDisableAndroidBackButton = (shouldDisable: boolean = true): void =>
  useFocusEffect(
    useCallback(() => {
      if (!shouldDisable) return;

      const onBackPress = (): boolean => true;
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return (): void => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [shouldDisable]),
  );
