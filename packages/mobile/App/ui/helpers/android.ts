import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';

export const disableAndroidBackButton = (): void =>
  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean => true;
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return (): void => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );
