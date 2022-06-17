import React, { FunctionComponent, ReactElement, useCallback, useState } from 'react';
import { KeyboardAvoidingView, StatusBar } from 'react-native';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  ColumnView,
  StyledTouchableOpacity,
  StyledText,
} from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { ChangePasswordForm } from '/components/Forms/ChangePasswordForm/ChangePasswordForm';
import { Routes } from '/helpers/routes';
import { ModalInfo } from '/components/ModalInfo';
import { ChangePasswordFormModel } from '~/ui/interfaces/forms/ChangePasswordFormProps';
import { useAuth } from '~/ui/contexts/AuthContext';
import { Button } from '/components/Button';
import { ChangePasswordProps } from '/interfaces/Screens/SignUp/ChangePasswordProps';

export const ChangePassword: FunctionComponent<any> = ({ navigation }: ChangePasswordProps) => {
  const authCtx = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [success, setSuccess] = useState(false);

  const onNavigateToSignIn = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.SignIn);
  }, []);

  const onNavigateToResetPassword = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.ResetPassword);
  }, []);

  const onChangeModalVisibility = useCallback((isVisible: boolean) => {
    setModalVisible(isVisible);
  }, []);

  const setModalError = useCallback((message: string) => {
    setErrorMessage(message);
    onChangeModalVisibility(true);
  }, []);

  const onSubmitForm = useCallback(async (values: ChangePasswordFormModel) => {
    try {
      if (!values.server) {
        // TODO it would be better to properly respond to form validation and show the error
        setModalError('Please select a server to connect to');
        return;
      }
      await authCtx.changePassword(values);
      setSuccess(true);
    } catch (error) {
      setModalError(error.message);
    }
  }, []);

  const renderForm = (): ReactElement => (
    <>
      <ChangePasswordForm onSubmitForm={onSubmitForm} email={authCtx.resetPasswordLastEmailUsed} />
      <StyledTouchableOpacity onPress={onNavigateToResetPassword}>
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
          Your password has been updated
        </StyledText>
      </ColumnView>
      <Button
        marginTop={20}
        backgroundColor={theme.colors.SECONDARY_MAIN}
        onPress={onNavigateToSignIn}
        textColor={theme.colors.TEXT_SUPER_DARK}
        fontSize={screenPercentageToDP('1.94', Orientation.Height)}
        fontWeight={500}
        buttonText="Login"
      />
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
              Reset Password
            </StyledText>
          </StyledView>
          {success && renderSuccess()}
          {!success && renderForm()}
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </FullView>
  );
};
