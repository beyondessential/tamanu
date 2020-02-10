import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { Dimensions } from 'react-native';
import { SCREEN_ORIENTATION } from './constants';

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
