import React, { memo } from 'react';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const ScheduledVaccine = memo(
  ({
    size = screenPercentageToDP(3.64, Orientation.Height),
  }: {
    size: number;
  }) => (
    <StyledView
      borderRadius={50}
      height={size}
      width={size}
      background={theme.colors.WHITE}
      borderWidth={1}
      borderColor={theme.colors.BOX_OUTLINE}
    />
  ),
);
