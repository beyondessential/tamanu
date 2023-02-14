import { FC } from 'react';
import { IconWithSizeProps } from '~/ui/interfaces/WithSizeProps';

export interface MenuOptionButtonProps {
  Icon?: FC<IconWithSizeProps>;
  title: string;
  onPress: () => void;
  fontWeight?: number;
}
