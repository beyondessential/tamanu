import React from 'react';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { StyledView, CenterView } from '../../styled/common';
import { Folder } from '../Icons';
import theme from '../../styled/theme';
import { Orientation, screenPercentageToDp } from '../../helpers/screen';

interface CircularProgressProps {
  progress: number;
}

export const CircularProgress = ({ progress }: CircularProgressProps) => (
  <StyledView
    height={screenPercentageToDp('13.73', Orientation.Height)}
    width={screenPercentageToDp('13.73', Orientation.Height)}
  >
    <AnimatedCircularProgress
      size={screenPercentageToDp('13.73', Orientation.Height)}
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
        height={screenPercentageToDp('5.58', Orientation.Height)}
        width={screenPercentageToDp('9.45', Orientation.Width)}
      />
    </CenterView>
  </StyledView>
);
