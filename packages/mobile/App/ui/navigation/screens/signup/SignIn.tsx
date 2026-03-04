import React, { FunctionComponent, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { KeyboardAvoidingView, Linking, StatusBar } from 'react-native';
import {
  FullView,
  RowView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { CrossIcon, HomeBottomLogoIcon } from '/components/Icons';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { SignInForm } from '/components/Forms/SignInForm';
import { SignInProps } from '/interfaces/Screens/SignUp/SignInProps';
import { Routes } from '/helpers/routes';
import { ModalInfo } from '/components/ModalInfo';
import { authSelector } from '/helpers/selectors';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { LanguageSelectButton } from './LanguageSelectButton';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { SupportCentreButton } from './SupportCentreButton';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

interface ModalContent {
  message: string;
  buttonPrompt?: string;
  buttonUrl?: string;
}

export const SignIn: FunctionComponent<any> = ({ navigation }: SignInProps) => {
  const authState = useSelector(authSelector);

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
  const { getLocalisation } = useLocalisation();

  const supportCentreUrl = getLocalisation('supportDeskUrl');
  const isSupportUrlLoaded = !!supportCentreUrl;

  return (
    <FullView background={theme.colors.PRIMARY_MAIN} justifyContent="space-between">
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
            marginTop={screenPercentageToDP(5.29, Orientation.Height)}
            marginBottom={screenPercentageToDP(10.7, Orientation.Height)}
          >
            <>
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
            </>
          </StyledView>
          <StyledView marginLeft={screenPercentageToDP(2.43, Orientation.Width)}>
            <StyledText fontSize={30} fontWeight="bold" marginBottom={5} color={theme.colors.WHITE}>
              <TranslatedText stringId="login.heading.login" fallback="Log in" />
            </StyledText>
            <StyledText fontSize={14} color={theme.colors.WHITE}>
              <TranslatedText
                stringId="login.subTitle"
                fallback="Enter your details below to log in"
              />
            </StyledText>
          </StyledView>
          <SignInForm
            onOutdatedVersionError={(error: Error): void => {
              showErrorModal({
                message: error.message,
                buttonPrompt: 'Update',
                buttonUrl: error.updateUrl,
              });
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
              marginTop={screenPercentageToDP(2.43, Orientation.Height)}
              fontSize={screenPercentageToDP(1.57, Orientation.Height)}
              color={theme.colors.WHITE}
              textDecorationLine="underline"
            >
              <TranslatedText stringId="login.action.forgotPassword" fallback="Forgot password?" />
            </StyledText>
          </StyledTouchableOpacity>
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
      <StyledView
        flexDirection="row"
        justifyContent="space-between"
        alignItems="flex-end"
        display="flex"
        paddingBottom={screenPercentageToDP(5, Orientation.Width)}
        paddingLeft={screenPercentageToDP(2.43, Orientation.Width)}
        paddingRight={screenPercentageToDP(2.43, Orientation.Width)}
      >
        <LanguageSelectButton navigation={navigation} />
        {isSupportUrlLoaded && <SupportCentreButton supportCentreUrl={supportCentreUrl} />}
      </StyledView>
    </FullView>
  );
};
