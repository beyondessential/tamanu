import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { StyledSafeAreaView, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { useFormikContext } from 'formik';
import { Button } from '../../../Button';

export const SubmitSection = ({
  onPress,
  isEdit,
}: { onPress: () => void; isEdit: boolean }): ReactElement => {
  const form = useFormikContext();
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
        <Button
          loadingAction={form.isSubmitting}
          onPress={onPress}
          buttonText={submitText}
          backgroundColor={theme.colors.PRIMARY_MAIN}
        />
      </StyledSafeAreaView>
    </StyledView>
  );
};
