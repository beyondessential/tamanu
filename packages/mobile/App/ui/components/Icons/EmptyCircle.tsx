import { StyledView } from '/styled/common';
import React, { memo } from 'react';
import { Orientation, screenPercentageToDP } from '../../helpers/screen';
import { theme } from '../../styled/theme';

const size = screenPercentageToDP(3.03, Orientation.Height);

export const EmptyCircleIcon = memo(() => (
  <StyledView
    height={size}
    width={size}
    borderRadius={50}
    background={theme.colors.WHITE}
  />
));
