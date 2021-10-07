import React, { ReactElement, useRef } from 'react';
import { StyledView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { Field } from '../FormField';
import { Button } from '../../Button';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { TextField } from '../../TextField/TextField';
import { ServerSelector } from '../../ServerSelectorField/ServerSelector';

type SignInFieldsProps = {
  handleSubmit: (value: any) => void;
  isSubmitting: boolean;
};

export const SignInFields = ({
  handleSubmit,
  isSubmitting,
}: SignInFieldsProps): ReactElement => {
  const passwordRef = useRef(null);
  return (
    <StyledView
      marginTop={screenPercentageToDP(14.7, Orientation.Height)}
      marginRight={screenPercentageToDP(2.43, Orientation.Width)}
      marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
    >
      <StyledText
        fontSize={13}
        marginBottom={5}
        color={theme.colors.SECONDARY_MAIN}
      >
        ACCOUNT DETAILS
      </StyledText>
      <StyledView justifyContent="space-around">
        <ServerSelector />
        <Field
          name="email"
          keyboardType="email-address"
          component={TextField}
          label="Email"
          blurOnSubmit={false}
          returnKeyType="next"
          onSubmitEditing={(): void => {
            passwordRef.current.focus();
          }}
        />
        <Field
          name="password"
          inputRef={passwordRef}
          autoCapitalize="none"
          component={TextField}
          label="Password"
          secure
          onSubmitEditing={handleSubmit}
        />
      </StyledView>
      <Button
        marginTop={20}
        backgroundColor={theme.colors.SECONDARY_MAIN}
        onPress={handleSubmit}
        loadingAction={isSubmitting}
        textColor={theme.colors.TEXT_SUPER_DARK}
        fontSize={screenPercentageToDP('1.94', Orientation.Height)}
        fontWeight={500}
        buttonText="Sign in"
      />
    </StyledView>
  );
};
