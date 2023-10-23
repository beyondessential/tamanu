import React, { FunctionComponent, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { KeyboardAvoidingView, StatusBar, Linking } from 'react-native';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  RowView,
  StyledTouchableOpacity,
  StyledText,
} from '/styled/common';
import { CrossIcon, HomeBottomLogoIcon } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { SignInForm } from '/components/Forms/SignInForm';
import { SignInProps } from '/interfaces/Screens/SignUp/SignInProps';
import { Routes } from '/helpers/routes';
import { ModalInfo } from '/components/ModalInfo';
import { authSelector } from '/helpers/selectors';
import { OutdatedVersionError } from '~/services/error';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';

interface ModalContent {
  message: string;
  buttonPrompt?: string;
  buttonUrl?: string;
}

export const SignIn: FunctionComponent<any> = ({ navigation }: SignInProps) => {
  const authState = useSelector(authSelector);
  const { toggleDebugMode, getDebugMode } = useTranslation();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent>({ message: '' });

  const onNavigateToForgotPassword = useCallback(() => {
    console.log('onNavigateToForgotPassword...');
    navigation.navigate(Routes.SignUpStack.ResetPassword);
  }, []);

  const onChangeModalVisibility = useCallback((isVisible: boolean) => {
    setModalVisible(isVisible);
  }, []);

  const showErrorModal = useCallback((content: ModalContent) => {
    setModalContent(content);
    onChangeModalVisibility(true);
  }, []);

  const onFollowPrompt = useCallback(() => {
    Linking.openURL(modalContent.buttonUrl);
  }, [modalContent.buttonUrl]);

  const { facilityId } = useFacility();

  return (
    <FullView background={theme.colors.PRIMARY_MAIN}>
      {__DEV__ && <StyledTouchableOpacity onPress={() => toggleDebugMode()}><StyledText color="white" >Translation Debug: {getDebugMode() ? 'ON' : 'OFF'}</StyledText></StyledTouchableOpacity>}
      <StatusBar barStyle="light-content" />
      <ModalInfo
        onVisibilityChange={onChangeModalVisibility}
        message={modalContent.message}
        buttonPrompt={modalContent.buttonPrompt}
        onFollowPrompt={onFollowPrompt}
        isVisible={modalVisible}
      />
      <StyledSafeAreaView>
        <KeyboardAvoidingView behavior="position">
          <RowView width="100%" justifyContent="flex-end" position="absolute" top={0}>
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
            style={{ flexDirection: 'row', justifyContent: 'center' }}
            marginTop={screenPercentageToDP(7.29, Orientation.Height)}
            marginBottom={screenPercentageToDP(14.7, Orientation.Height)}
          >
            <HomeBottomLogoIcon
              size={screenPercentageToDP(7.29, Orientation.Height)}
              fill={theme.colors.SECONDARY_MAIN}
            />
            <StyledText
              marginLeft={screenPercentageToDP(0.5, Orientation.Height)}
              fontSize="40"
              color={theme.colors.WHITE}
              fontWeight="bold"
              verticalAlign="center"
            >
              tamanu
            </StyledText>
          </StyledView>
          <StyledView marginLeft={screenPercentageToDP(2.43, Orientation.Width)}>
            <StyledText fontSize={30} fontWeight="bold" marginBottom={5} color={theme.colors.WHITE}>
              <TranslatedText fallback="mate" />
            </StyledText>
            <StyledText fontSize={14} color={theme.colors.WHITE}>
              Enter your details below to log in
            </StyledText>
          </StyledView>
          <SignInForm
            onError={(error: Error): void => {
              if (error instanceof OutdatedVersionError) {
                showErrorModal({
                  message: error.message,
                  buttonPrompt: 'Update',
                  buttonUrl: error.updateUrl,
                });
              } else {
                showErrorModal({ message: error.message });
              }
            }}
            onSuccess={(): void => {
              if (!facilityId) {
                navigation.navigate(Routes.SignUpStack.SelectFacility);
              } else if (authState.isFirstTime) {
                navigation.navigate(Routes.HomeStack.Index);
              } else {
                navigation.navigate(Routes.HomeStack.Index, {
                  screen: Routes.HomeStack.HomeTabs.Index,
                });
              }
            }}
          />
          <StyledTouchableOpacity onPress={onNavigateToForgotPassword}>
            <StyledText
              width="100%"
              textAlign="center"
              marginTop={screenPercentageToDP('2.43', Orientation.Height)}
              marginBottom={screenPercentageToDP('4.86', Orientation.Height)}
              fontSize={screenPercentageToDP('1.57', Orientation.Height)}
              color={theme.colors.WHITE}
              textDecorationLine="underline"
            >
              Forgot password?
            </StyledText>
          </StyledTouchableOpacity>
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </FullView>
  );
};
