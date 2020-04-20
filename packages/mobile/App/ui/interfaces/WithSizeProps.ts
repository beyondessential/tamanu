import { SvgProps } from 'react-native-svg';
import { AnimatedValue } from 'react-navigation';

export interface IconWithSizeProps extends SvgProps {
  size?: number | string | AnimatedValue;
  background?: string;
}
