import React from 'react';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { StyledView, CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { Folder } from '../Icons';

interface CircularProgressProps {
  progress: number;
}

export const CircularProgress = ({
  progress,
}: CircularProgressProps): JSX.Element => (
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
      <Folder
        fill={theme.colors.WHITE}
        height={screenPercentageToDP('5.58', Orientation.Height)}
        width={screenPercentageToDP('9.45', Orientation.Width)}
      />
    </CenterView>
  </StyledView>
);
