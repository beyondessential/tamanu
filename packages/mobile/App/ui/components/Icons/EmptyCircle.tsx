import React, { memo } from 'react';
import { StyledView } from '/styled/common';
import { theme } from '../../styled/theme';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';

const size = screenPercentageToDP(3.03, Orientation.Height);

export const EmptyCircleIcon = memo(() => (
  <StyledView
    height={size}
    width={size}
    borderRadius={50}
    background={theme.colors.WHITE}
  />
));
