import React, { type FunctionComponent, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Alert, KeyboardAvoidingView, Linking, StatusBar } from 'react-native';
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
import type { SignInProps } from '/interfaces/Screens/SignUp/SignInProps';
import { Routes } from '/helpers/routes';
import { authSelector } from '/helpers/selectors';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { LanguageSelectButton } from './LanguageSelectButton';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { SupportCentreButton } from './SupportCentreButton';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import type { OutdatedVersionError } from '~/services/error';

export const SignIn: FunctionComponent<any> = ({ navigation }: SignInProps) => {
  const authState = useSelector(authSelector);
  const { getTranslation } = useTranslation();

  const onNavigateToForgotPassword = useCallback(() => {
    console.log('onNavigateToForgotPassword...');
    navigation.navigate(Routes.SignUpStack.ResetPassword);
  }, []);

  const showOutdatedVersionAlert = useCallback(
    (error: OutdatedVersionError) => {
      console.log(error);
      Alert.alert(getTranslation('login.outdatedVersion.title', 'Update required'), error.message, [
        { text: getTranslation('general.action.dismiss', 'Dismiss'), style: 'cancel' },
        {
          text: getTranslation('general.action.update', 'Update'),
          onPress: () => Linking.openURL(error.updateUrl),
        },
      ]);
    },
    [getTranslation],
  );

  const { facilityId } = useFacility();
  const { getLocalisation } = useLocalisation();

  const supportCentreUrl = getLocalisation('supportDeskUrl');

  return (
    <FullView background={theme.colors.PRIMARY_MAIN} justifyContent="space-between">
      <StatusBar barStyle="light-content" />
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
            onOutdatedVersionError={showOutdatedVersionAlert}
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
        {supportCentreUrl && <SupportCentreButton supportCentreUrl={supportCentreUrl} />}
      </StyledView>
    </FullView>
  );
};
