import React, { ReactElement, useState, useEffect } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { Field } from '../FormField';
import { Button } from '../../Button';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { TextField } from '../../TextField/TextField';
import { ServerSelector } from '../../ServerSelectorField/ServerSelector';

type ResetPasswordFieldsProps = {
  handleSubmit: (value: any) => void;
  isSubmitting: boolean;
};

export const ResetPasswordFields = ({
  handleSubmit,
  isSubmitting,
}: ResetPasswordFieldsProps): ReactElement => (
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
        Enter your account email
      </StyledText>
      <Field
        name="email"
        keyboardType="email-address"
        component={TextField}
        labelColor={theme.colors.WHITE}
        label="Email"
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
      buttonText="Reset Password"
    />
  </StyledView>
);