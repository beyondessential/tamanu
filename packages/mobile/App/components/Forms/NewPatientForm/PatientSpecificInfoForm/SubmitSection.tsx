import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { StyledView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';
import { Button } from '/components/Button';

export const SubmitSection = ({
  onPress,
}: {
  onPress: () => void;
}): ReactElement => (
  <StyledView
    flex={1 / 10}
    background={theme.colors.BACKGROUND_GREY}
    justifyContent="flex-end"
  >
    <StyledSafeAreaView
      borderTopWidth={StyleSheet.hairlineWidth}
      borderColor={theme.colors.DEFAULT_OFF}
      background={theme.colors.WHITE}
      height={90}
      justifyContent="center"
      padding={20}
    >
      <Button
        onPress={onPress}
        buttonText="Create New Patient"
        backgroundColor={theme.colors.PRIMARY_MAIN}
      />
    </StyledSafeAreaView>
  </StyledView>
);
