import { VerticalPosition } from '/interfaces/VerticalPosition';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { Dimensions, Platform, StatusBar } from 'react-native';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';

export const dropdownSize = {
  itemHeight: 44,
  dropdownMaxHeight: 165,
  padding: 16,
  distanceFromScreenBottom: 40,
  distanceFromPlaceholder: -32,
};

export enum SCREEN_ORIENTATION {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

export enum Orientation {
  Width = 'width',
  Height = 'height',
}

export const screenPercentageToDP = (
  value: string | number,
  orientation: Orientation,
): number =>
  orientation === Orientation.Width
    ? widthPercentageToDP(value)
    : heightPercentageToDP(value);

export const getOrientation = (): SCREEN_ORIENTATION =>
  Dimensions.get('window').width < Dimensions.get('window').height
    ? SCREEN_ORIENTATION.PORTRAIT
    : SCREEN_ORIENTATION.LANDSCAPE;

export const scrollTo = (
  scrollViewRef: any,
  position: { x: number; y: number },
): void => {
  if (scrollViewRef) {
    scrollViewRef.current.scrollTo(position);
  }
};

export const calculateVerticalPositions = (
  fieldList: string[],
  inputOffset = 65,
): VerticalPosition =>
  fieldList.reduce<{ pos: VerticalPosition; off: number }>(
    (acc, cur, index) => {
      acc.pos[cur] = {
        x: 0,
        y: index === 0 ? 0 : acc.off + 35,
      };
      acc.off += inputOffset;
      return acc;
    },
    { pos: {}, off: 0 },
  ).pos;

export const calculateDropdownPosition = (
  placeholderPosition: number,
  dataLength: number,
): number => {
  const dropdownHeight = dataLength * dropdownSize.itemHeight + dropdownSize.padding
      > dropdownSize.dropdownMaxHeight
    ? dropdownSize.dropdownMaxHeight
    : dataLength * dropdownSize.itemHeight + dropdownSize.padding;

  const screenDimensions = Dimensions.get('window');

  const initialPosition = placeholderPosition - dropdownSize.distanceFromPlaceholder;
  const bottomMax = screenDimensions.height - dropdownSize.distanceFromScreenBottom;

  if (initialPosition + dropdownHeight > bottomMax) {
    return bottomMax - dropdownHeight;
  }
  return initialPosition;
};

export const setStatusBar = (
  barStyle: 'light-content' | 'dark-content',
  backgroundColor: string,
): void =>
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') StatusBar.setBackgroundColor(backgroundColor);
      StatusBar.setBarStyle(barStyle);
    }, []),
  );
