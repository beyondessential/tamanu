import React, { ReactElement, useEffect, useState, useCallback } from 'react';
import { StyledText, FullView, CenterView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { CircularProgress } from '/components/CircularProgress';
import { Button } from '/components/Button';

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
  return (
    <FullView background={theme.colors.MAIN_SUPER_DARK}>
      <CenterView flex={1}>
        <CircularProgress progress={progress} />
        <StyledText
          marginTop={25}
          fontWeight={500}
          color={theme.colors.SECONDARY_MAIN}
          fontSize={21}
        >
          Data Syncing Now
        </StyledText>
        <StyledView marginTop={80} alignItems="center">
          <StyledText fontWeight={500} color={theme.colors.WHITE}>
            Last successful Sync
          </StyledText>
          <StyledText fontWeight={500} color={theme.colors.WHITE}>
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
