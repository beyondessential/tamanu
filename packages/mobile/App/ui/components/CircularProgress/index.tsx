import React, { ReactElement } from 'react';
import { StyledView, CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { SyncDataIcon } from '../Icons';

interface CircularProgressProps {
  progress: number;
}

export const CircularProgress = ({ progress }: CircularProgressProps): ReactElement => (
  <StyledView
    height={screenPercentageToDP('13.73', Orientation.Height)}
    width={screenPercentageToDP('13.73', Orientation.Height)}
  >
    <AnimatedCircularProgress
      size={screenPercentageToDP('13.73', Orientation.Height)}
      width={3}
      rotation={0}
      fill={progress}
      tintColor={theme.colors.SECONDARY_MAIN}
    />
    <CenterView width="100%" height="100%" position="absolute">
      <StyledView
        position="absolute"
        borderRadius={100}
        borderColor={theme.colors.PROGRESS_BACKGROUND}
        borderWidth={3}
        height="95%"
        width="95%"
      />
      <SyncDataIcon
        fill={theme.colors.MAIN_SUPER_DARK}
        size={screenPercentageToDP('5.58', Orientation.Height)}
      />
    </CenterView>
  </StyledView>
);
