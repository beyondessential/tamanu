import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { theme } from '/styled/theme';
import { CenterView, StyledView } from '/styled/common';

const Circle = ({ size }: { size: number | string }) => (
  <StyledView
    background={theme.colors.WHITE}
    height={size}
    width={size}
    borderWidth={StyleSheet.hairlineWidth}
    borderColor={theme.colors.BOX_OUTLINE}
    borderRadius={50}
  />
);

export const ScheduledVaccine = memo(
  ({ size = 34 }: { size: number | string }) => (
    <CenterView flex={1}>
      <Circle size={size} />
    </CenterView>
  ),
);
