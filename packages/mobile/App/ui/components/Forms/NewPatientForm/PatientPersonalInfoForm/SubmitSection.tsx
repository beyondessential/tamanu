import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { StyledView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';
import { SubmitButton } from '../../SubmitButton';

export const SubmitSection = ({
  onPress,
  isEdit,
}: { onPress: () => void; isEdit: boolean }): ReactElement => {
  const submitText = isEdit ? 'Save' : 'Create New Patient';
  return (
    <StyledView
      flex={1}
      background={theme.colors.BACKGROUND_GREY}
      justifyContent="flex-end"
      marginTop={40}
    >
      <StyledSafeAreaView
        borderTopWidth={StyleSheet.hairlineWidth}
        borderColor={theme.colors.DEFAULT_OFF}
        height={90}
        justifyContent="center"
        padding={20}
      >
        <SubmitButton
          onSubmit={onPress}
          buttonText={submitText}
        />
      </StyledSafeAreaView>
    </StyledView>
  );
};
