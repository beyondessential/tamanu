import React, { ReactElement } from 'react';
import { StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Field } from '../FormField';
import { SubmitButton } from '../SubmitButton';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { TextField } from '../../TextField/TextField';
import { ServerSelector } from '../../ServerSelectorField/ServerSelector';
import { TranslatedText } from '../../Translations/TranslatedText';

export const ResetPasswordFields = (): ReactElement => (
  <StyledView
    marginTop={screenPercentageToDP(14.7, Orientation.Height)}
    marginRight={screenPercentageToDP(2.43, Orientation.Width)}
    marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
  >
    <StyledView justifyContent="space-around">
      <StyledText fontSize={13} marginBottom={5} color={theme.colors.SECONDARY_MAIN}>
        <TranslatedText
          stringId="auth.resetPassword.enterAccountEmail"
          fallback="Enter your account email"
        />
      </StyledText>
      <Field
        name="email"
        keyboardType="email-address"
        component={TextField}
        labelColor={theme.colors.WHITE}
        label={<TranslatedText stringId="login.email.label" fallback="Email" />}
      />
      <Field
        name="server"
        component={ServerSelector}
        label={
          <TranslatedText stringId="auth.resetPassword.selectCountry" fallback="Select a country" />
        }
      />
    </StyledView>
    <SubmitButton
      marginTop={20}
      backgroundColor={theme.colors.SECONDARY_MAIN}
      textColor={theme.colors.TEXT_SUPER_DARK}
      fontSize={screenPercentageToDP('1.94', Orientation.Height)}
      fontWeight={500}
      buttonText={
        <TranslatedText stringId="login.resetPassword.heading" fallback="Reset password" />
      }
    />
  </StyledView>
);
