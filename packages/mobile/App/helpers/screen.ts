import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';

export enum Orientation {
  Width = 'width',
  Height = 'height',
}

export function screenPercentageToDP(
  value: string | number,
  orientation: Orientation,
) {
  return orientation === Orientation.Width
    ? widthPercentageToDP(value)
    : heightPercentageToDP(value);
}
