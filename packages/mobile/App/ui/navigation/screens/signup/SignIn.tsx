import React, {
  FunctionComponent,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { Platform, KeyboardAvoidingView, StatusBar } from 'react-native';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  RowView,
  StyledTouchableOpacity,
  StyledText,
} from '/styled/common';
import { CrossIcon, UserIcon } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { SignInForm } from '/components/Forms/SignInForm/SignInForm';
import { SignInProps } from '/interfaces/Screens/SignUp/SignInProps';
import { Routes } from '/helpers/routes';
import { ModalInfo } from '/components/ModalInfo';
import { authSelector } from '/helpers/selectors';
import { SignInFormModel } from '~/ui/interfaces/forms/SignInFormProps';
import AuthContext from '~/ui/contexts/AuthContext';

export const SignIn: FunctionComponent<any> = ({ navigation }: SignInProps) => {
  const authCtx = useContext(AuthContext);
  const authState = useSelector(authSelector);

  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onNavigateToForgotPassword = useCallback(() => {
    console.log('onNavigateToForgotPassword...');
  }, []);

  const onChangeModalVisibility = useCallback((isVisible: boolean) => {
    setModalVisible(isVisible);
  }, []);

  const setModalError = useCallback((message: string) => {
    setErrorMessage(message);
    onChangeModalVisibility(true);
  }, []);

  const onSubmitForm = useCallback(async (values: SignInFormModel) => {
    try {
      if (!values.server) {
        // TODO it would be better to properly respond to form validation and show the error
        setModalError('Please select a server to connect to');
        return;
      }
      await authCtx.signIn(values);

      if (authState.isFirstTime) {
        navigation.navigate(Routes.HomeStack.Index);
      } else {
        navigation.navigate(Routes.HomeStack.Index, {
          screen: Routes.HomeStack.HomeTabs.Index,
        });
      }
    } catch (error) {
      setModalError(error.message);
    }
  }, []);

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
          <RowView
            width="100%"
            justifyContent="flex-end"
            position="absolute"
            top={Platform.OS === 'ios' ? 30 : 0}
          >
            <StyledTouchableOpacity
              onPress={(): void => navigation.navigate(Routes.SignUpStack.Intro)}
              padding={screenPercentageToDP(2.43, Orientation.Height)}
            >
              <CrossIcon
                height={screenPercentageToDP(2.43, Orientation.Height)}
                width={screenPercentageToDP(2.43, Orientation.Height)}
              />
            </StyledTouchableOpacity>
          </RowView>
          <StyledView
            width="100%"
            alignItems="center"
            marginTop={screenPercentageToDP(7.29, Orientation.Height)}
            marginBottom={screenPercentageToDP(14.7, Orientation.Height)}
          >
            <UserIcon
              height={screenPercentageToDP(7.29, Orientation.Height)}
              width={screenPercentageToDP(7.29, Orientation.Height)}
              fill={theme.colors.SECONDARY_MAIN}
            />
            <StyledText
              marginTop={screenPercentageToDP('2.43', Orientation.Height)}
              fontSize={screenPercentageToDP('2.55', Orientation.Height)}
              color={theme.colors.WHITE}
              fontWeight="bold"
            >
              Sign in
            </StyledText>
          </StyledView>
          <SignInForm onSubmitForm={onSubmitForm} />
          <StyledTouchableOpacity onPress={onNavigateToForgotPassword}>
            <StyledText
              width="100%"
              textAlign="center"
              marginTop={screenPercentageToDP('2.43', Orientation.Height)}
              marginBottom={screenPercentageToDP('4.86', Orientation.Height)}
              fontSize={screenPercentageToDP('1.57', Orientation.Height)}
              color={theme.colors.SECONDARY_MAIN}
            >
              Forgot your password?
            </StyledText>
          </StyledTouchableOpacity>
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </FullView>
  );
};
