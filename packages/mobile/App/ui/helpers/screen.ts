import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { Dimensions } from 'react-native';
import { SCREEN_ORIENTATION } from './constants';
import { VerticalPosition } from '/interfaces/VerticalPosition';

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
  fieldList: string[], inputOffset = 65
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
