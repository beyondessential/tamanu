import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { StyledView, StyledSafeAreaView } from '/styled/common';
import { theme } from '/styled/theme';
import { useFormikContext } from 'formik';
import { Button } from '../../../Button';

export const SubmitSection = ({
  onPress,
}: { onPress: () => void}): ReactElement => {
  const form = useFormikContext();
  return (
    <StyledView
      flex={10 / 10}
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
        <Button
          loadingAction={form.isSubmitting}
          onPress={onPress}
          buttonText="Create New Patient"
          backgroundColor={theme.colors.PRIMARY_MAIN}
        />
      </StyledSafeAreaView>
    </StyledView>
  );
};
