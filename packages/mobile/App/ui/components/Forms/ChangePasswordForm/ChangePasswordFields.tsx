import React, { ReactElement } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { Field } from '../FormField';
import { Button } from '../../Button';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { TextField } from '../../TextField/TextField';
import { ServerSelector } from '../../ServerSelectorField/ServerSelector';

type ChangePasswordFieldsProps = {
  handleSubmit: (value: any) => void;
  isSubmitting: boolean;
};

export const ChangePasswordFields = ({
  handleSubmit,
  isSubmitting,
}: ChangePasswordFieldsProps): ReactElement => (
  <StyledView
    marginTop={screenPercentageToDP(14.7, Orientation.Height)}
    marginRight={screenPercentageToDP(2.43, Orientation.Width)}
    marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
  >
    <StyledView
      justifyContent="space-around"
    >
      <StyledText
        fontSize={13}
        marginBottom={5}
        color={theme.colors.SECONDARY_MAIN}
      >
        Please enter the reset code you have received in your email
      </StyledText>
      <Field
        name="token"
        component={TextField}
        keyboardType="default"
      />
      <StyledText
        fontSize={13}
        marginTop={15}
        marginBottom={5}
        color={theme.colors.SECONDARY_MAIN}
      >
        Enter a new password
      </StyledText>
      <Field
        name="newPassword"
        component={TextField}
        secure
      />
      <Field name="server" component={ServerSelector} label="Select a country" />
    </StyledView>
    <Button
      marginTop={20}
      backgroundColor={theme.colors.SECONDARY_MAIN}
      onPress={handleSubmit}
      loadingAction={isSubmitting}
      textColor={theme.colors.TEXT_SUPER_DARK}
      fontSize={screenPercentageToDP('1.94', Orientation.Height)}
      fontWeight={500}
      buttonText="Change Password"
    />
  </StyledView>
);
