import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import React, { memo } from 'react';

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
