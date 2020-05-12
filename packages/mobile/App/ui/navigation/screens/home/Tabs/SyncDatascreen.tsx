import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import { StyledText, FullView, CenterView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { CircularProgress } from '/components/CircularProgress';
import { Button } from '/components/Button';
import {
  setStatusBar,
  screenPercentageToDP,
  Orientation,
} from '/root/App/ui/helpers/screen';

export const SyncDataScreen = (): ReactElement => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (progress >= 100) setProgress(0);
  }, [progress]);

  const manualSync = useCallback(() => {
    setProgress(0);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 100));
    }, 600);
    return (): void => clearInterval(interval);
  }, []);
  setStatusBar('light-content', theme.colors.MAIN_SUPER_DARK);

  return (
    <FullView background={theme.colors.MAIN_SUPER_DARK}>
      <CenterView flex={1}>
        <CircularProgress progress={progress} />
        <StyledText
          marginTop={25}
          fontWeight={500}
          color={theme.colors.SECONDARY_MAIN}
          fontSize={screenPercentageToDP(2.55, Orientation.Height)}
        >
          Data Syncing Now
        </StyledText>
        <StyledView
          marginTop={screenPercentageToDP(9.72, Orientation.Height)}
          alignItems="center"
        >
          <StyledText
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            fontWeight={500}
            color={theme.colors.WHITE}
          >
            Last successful Sync
          </StyledText>
          <StyledText
            fontSize={screenPercentageToDP(1.7, Orientation.Height)}
            fontWeight={500}
            color={theme.colors.WHITE}
          >
            monday 10 august, 7:35pm
          </StyledText>
        </StyledView>
        <Button
          onPress={manualSync}
          width={160}
          outline
          textColor={theme.colors.WHITE}
          borderColor={theme.colors.WHITE}
          buttonText="Manual Sync"
          marginTop={20}
        />
      </CenterView>
    </FullView>
  );
};
