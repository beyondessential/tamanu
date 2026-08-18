import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// Inline replacements for react-native-responsive-screen (uses removed Dimensions.removeEventListener API)
let screenWidth = Dimensions.get('window').width;
let screenHeight = Dimensions.get('window').height;

Dimensions.addEventListener('change', ({ window }) => {
  screenWidth = window.width;
  screenHeight = window.height;
});

const widthPercentageToDP = (widthPercent: string | number): number => {
  const elemWidth =
    typeof widthPercent === 'number' ? widthPercent : parseFloat(String(widthPercent));
  return PixelRatio.roundToNearestPixel((screenWidth * elemWidth) / 100);
};

const heightPercentageToDP = (heightPercent: string | number): number => {
  const elemHeight =
    typeof heightPercent === 'number' ? heightPercent : parseFloat(String(heightPercent));
  return PixelRatio.roundToNearestPixel((screenHeight * elemHeight) / 100);
};

export const dropdownSize = {
  itemHeight: 44,
  dropdownMaxHeight: 165,
  padding: 16,
  distanceFromScreenBottom: 40,
  distanceFromPlaceholder: -32,
};

export const Orientation = {
  Width: 'width',
  Height: 'height',
} as const;

export type Orientation = (typeof Orientation)[keyof typeof Orientation];

export const screenPercentageToDP = (value: string | number, orientation: Orientation): number =>
  orientation === Orientation.Width ? widthPercentageToDP(value) : heightPercentageToDP(value);

export const scrollTo = (scrollViewRef: any, position: { x: number; y: number }): void => {
  if (scrollViewRef) {
    scrollViewRef.current.scrollTo(position);
  }
};

export const calculateDropdownPosition = (
  placeholderPosition: number,
  dataLength: number,
): number => {
  const dropdownHeight =
    dataLength * dropdownSize.itemHeight + dropdownSize.padding > dropdownSize.dropdownMaxHeight
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
