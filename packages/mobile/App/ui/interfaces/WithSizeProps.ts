import { SvgProps } from 'react-native-svg';
import { Value } from 'react-native-reanimated';

export interface IconWithSizeProps extends SvgProps {
  size?: number | string | Value<number>;
  background?: string;
}
