import type { FC } from 'react';
import type { IconWithSizeProps } from '~/ui/interfaces/WithSizeProps';

export interface MenuOptionButtonProps {
  Icon?: FC<IconWithSizeProps>;
  key?: string;
  title: React.ReactNode;
  onPress: () => void;
  fontWeight?: number;
  arrowForwardIconProps?: IconWithSizeProps;
  textProps?: {
    fontWeight: number;
    color: string;
  };
}
