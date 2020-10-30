import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { Dimensions, StatusBar, Platform } from 'react-native';
import { VerticalPosition } from '/interfaces/VerticalPosition';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export const SCREEN_ORIENTATION = {
  PORTRAIT: 'portrait',
  LANDSCAPE: 'landscape',
};

export enum Orientation {
  Width = 'width',
  Height = 'height',
}

export function screenPercentageToDP(
  value: string | number,
  orientation: Orientation,
): number {
  return orientation === Orientation.Width
    ? widthPercentageToDP(value)
    : heightPercentageToDP(value);
}

export const getOrientation = (): string => {
  if (Dimensions.get('window').width < Dimensions.get('window').height) {
    return SCREEN_ORIENTATION.PORTRAIT;
  }
  return SCREEN_ORIENTATION.LANDSCAPE;
};

export const scrollTo = (
  scrollViewRef: any,
  position: { x: number; y: number },
): void => {
  if (scrollViewRef) {
    scrollViewRef.current.scrollTo(position);
  }
};

export const calculateVerticalPositions = (
  fieldList: string[], inputOffset = 65,
): VerticalPosition => {
  let verticalOffset = 0;
  return fieldList.reduce<VerticalPosition>((acc, cur, index) => {
    acc[cur] = {
      x: 0,
      y: index === 0 ? 0 : verticalOffset + 35,
    };
    verticalOffset += inputOffset;
    return acc;
  }, {});
};

export const setStatusBar = (barStyle: 'light-content' | 'dark-content', backgroundColor: string): void => useFocusEffect(
  useCallback(() => {
    if (Platform.OS === 'android') StatusBar.setBackgroundColor(backgroundColor);
    StatusBar.setBarStyle(barStyle);
  }, []),
);
