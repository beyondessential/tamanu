import { SvgProps } from 'react-native-svg';

export interface IconWithSizeProps extends SvgProps {
  size?: number | string;
  background?: string;
  fill?: string;
}
