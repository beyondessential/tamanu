import React, { memo } from 'react';
import { StyledView } from '/styled/common';
import { theme } from '../../styled/theme';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';

const size = screenPercentageToDP(3.03, Orientation.Height);

interface EmptyCircleIconProps {
  fill: string;
}

export const EmptyCircleIcon = memo(({ fill = theme.colors.WHITE }: EmptyCircleIconProps) => (
  <StyledView height={size} width={size} borderRadius={50} background={fill} />
));
