import React, { FunctionComponent, ReactElement, useCallback, useState } from 'react';
import { KeyboardAvoidingView, StatusBar } from 'react-native';
import {
  ColumnView,
  FullView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { ResetPasswordForm } from '/components/Forms/ResetPasswordForm/ResetPasswordForm';
import { ResetPasswordProps } from '/interfaces/Screens/SignUp/ResetPasswordProps';
import { Routes } from '/helpers/routes';
import { ModalInfo } from '/components/ModalInfo';
import { ResetPasswordFormModel } from '~/ui/interfaces/forms/ResetPasswordFormProps';
import { useAuth } from '~/ui/contexts/AuthContext';
import { Button } from '/components/Button';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { getResetPasswordErrorMessage } from '@tamanu/errors';

export const ResetPassword: FunctionComponent<any> = ({ navigation }: ResetPasswordProps) => {
  const authCtx = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [success, setSuccess] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');

  const onNavigateToSignIn = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.SignIn);
  }, []);

  const onNavigateToChangePassword = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.ChangePassword);
  }, []);

  const onRestartFlow = useCallback(() => {
    setModalVisible(false);
    setErrorMessage('');
    setSuccess(false);
    setResetPasswordEmail('');
  }, []);

  const onChangeModalVisibility = useCallback((isVisible: boolean) => {
    setModalVisible(isVisible);
  }, []);

  const setModalError = useCallback((message: string) => {
    setErrorMessage(message);
    onChangeModalVisibility(true);
  }, []);

  const onSubmitForm = useCallback(async (values: ResetPasswordFormModel) => {
    try {
      if (!values.server) {
        throw new Error('Please select a server to connect to');
      }
      await authCtx.requestResetPassword(values);

      setSuccess(true);
      setResetPasswordEmail(values.email);
    } catch (error) {
      const message = getResetPasswordErrorMessage(error);
      setModalError(message);
    }
  }, []);

  const renderForm = (): ReactElement => (
    <>
      <ResetPasswordForm onSubmitForm={onSubmitForm} />
      <StyledTouchableOpacity onPress={onNavigateToSignIn}>
        <StyledText
          width="100%"
          textAlign="center"
          marginTop={screenPercentageToDP('2.43', Orientation.Height)}
          marginBottom={screenPercentageToDP('4.86', Orientation.Height)}
          fontSize={screenPercentageToDP('1.57', Orientation.Height)}
          color={theme.colors.SECONDARY_MAIN}
        >
          <TranslatedText stringId="general.action.back" fallback="Back" />
        </StyledText>
      </StyledTouchableOpacity>
    </>
  );

  const renderSuccess = (): ReactElement => (
    <StyledView
      marginTop={screenPercentageToDP(14.7, Orientation.Height)}
      marginRight={screenPercentageToDP(2.43, Orientation.Width)}
      marginLeft={screenPercentageToDP(2.43, Orientation.Width)}
    >
      <ColumnView
        padding={screenPercentageToDP(4.43, Orientation.Width)}
        margin={screenPercentageToDP(2.43, Orientation.Width)}
        style={{ backgroundColor: theme.colors.BACKGROUND_GREY }}
      >
        <StyledText fontSize={screenPercentageToDP('1.94', Orientation.Height)}>
          An email with instructions has been sent to:
        </StyledText>
        <StyledText
          fontSize={screenPercentageToDP('1.94', Orientation.Height)}
          fontWeight="bold"
          marginTop="10"
          marginBottom="10"
        >
          {resetPasswordEmail}
        </StyledText>
        <StyledText fontSize={screenPercentageToDP('1.94', Orientation.Height)}>
          If you do not receive this email within a few minutes please try again.
        </StyledText>
      </ColumnView>
      <Button
        marginTop={20}
        backgroundColor={theme.colors.SECONDARY_MAIN}
        onPress={onNavigateToChangePassword}
        textColor={theme.colors.TEXT_SUPER_DARK}
        fontSize={screenPercentageToDP('1.94', Orientation.Height)}
        fontWeight={500}
        buttonText="Continue"
      />
      <StyledTouchableOpacity onPress={onRestartFlow}>
        <StyledText
          width="100%"
          textAlign="center"
          marginTop={screenPercentageToDP('3.43', Orientation.Height)}
          marginBottom={screenPercentageToDP('2.43', Orientation.Height)}
          fontSize={screenPercentageToDP('1.57', Orientation.Height)}
          color={theme.colors.SECONDARY_MAIN}
        >
          Resend password reset email
        </StyledText>
      </StyledTouchableOpacity>
      <StyledTouchableOpacity onPress={onNavigateToSignIn}>
        <StyledText
          width="100%"
          textAlign="center"
          marginTop={screenPercentageToDP('2.43', Orientation.Height)}
          marginBottom={screenPercentageToDP('4.86', Orientation.Height)}
          fontSize={screenPercentageToDP('1.57', Orientation.Height)}
          color={theme.colors.SECONDARY_MAIN}
        >
          Back
        </StyledText>
      </StyledTouchableOpacity>
    </StyledView>
  );

  return (
    <FullView background={theme.colors.PRIMARY_MAIN}>
      <StatusBar barStyle="light-content" />
      <ModalInfo
        onVisibilityChange={onChangeModalVisibility}
        isVisible={modalVisible}
        message={errorMessage}
      />
      <StyledSafeAreaView>
        <KeyboardAvoidingView behavior="position">
          <StyledView
            width="100%"
            alignItems="center"
            marginTop={screenPercentageToDP(7.29, Orientation.Height)}
            marginBottom={screenPercentageToDP(7.7, Orientation.Height)}
          >
            <StyledText
              marginTop={screenPercentageToDP('2.43', Orientation.Height)}
              fontSize={screenPercentageToDP('2.55', Orientation.Height)}
              color={theme.colors.WHITE}
              fontWeight="bold"
            >
              <TranslatedText stringId="resetPassword.heading" fallback="Reset password" />
            </StyledText>
          </StyledView>
          {success && renderSuccess()}
          {!success && renderForm()}
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </FullView>
  );
};
