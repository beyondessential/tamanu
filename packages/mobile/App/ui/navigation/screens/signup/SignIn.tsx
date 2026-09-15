import React, { type FunctionComponent, useCallback } from 'react';
import { Alert, KeyboardAvoidingView, Linking, StatusBar } from 'react-native';
import { useSelector } from 'react-redux';
import type { OutdatedVersionError } from '~/services/error';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { LanguageSelectButton } from './LanguageSelectButton';
import { SupportCentreButton } from './SupportCentreButton';
import { SignInForm } from '/components/Forms/SignInForm';
import { LogoV2Icon } from '/components/Icons';
import { Routes } from '/helpers/routes';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { authSelector } from '/helpers/selectors';
import type { SignInProps } from '/interfaces/Screens/SignUp/SignInProps';
import {
  FullView,
  StyledSafeAreaView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '/styled/common';
import { theme } from '/styled/theme';

export const SignIn: FunctionComponent<any> = ({ navigation, route }: SignInProps) => {
  const authState = useSelector(authSelector);
  const { getTranslation } = useTranslation();

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

  const { signedOutFromInactivity } = route.params;
  const inactivityMessage = signedOutFromInactivity
    ? getTranslation('login.error.inactivityLogout', 'Logged out due to inactivity')
    : '';

  const { facilityId } = useFacility();
  const { getLocalisation } = useLocalisation();

  const supportCentreUrl = getLocalisation('supportDeskUrl');
  const isSupportUrlLoaded = !!supportCentreUrl;

  return (
    <FullView background={theme.colors.PRIMARY_MAIN} justifyContent="space-between">
      <StatusBar barStyle="light-content" />
      <StyledSafeAreaView>
        <KeyboardAvoidingView behavior="position">
          <StyledView
            style={{ flexDirection: 'row', justifyContent: 'center' }}
            marginTop={screenPercentageToDP(5.29, Orientation.Height)}
            marginBottom={screenPercentageToDP(10.7, Orientation.Height)}
          >
            <LogoV2Icon
              height={screenPercentageToDP(7.29, Orientation.Height)}
              fill={theme.colors.WHITE}
            />
          </StyledView>
          <StyledView marginLeft={screenPercentageToDP(2.43, Orientation.Width)}>
            <StyledText fontSize={30} fontWeight="bold" marginBottom={5} color={theme.colors.WHITE}>
              <TranslatedText stringId="auth.action.login" fallback="Log in" />
            </StyledText>
            <StyledText fontSize={14} color={theme.colors.WHITE}>
              <TranslatedText
                stringId="login.subTitle"
                fallback="Enter your details below to log in"
              />
            </StyledText>
          </StyledView>
          <SignInForm
            initialErrorMessage={inactivityMessage}
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
          <StyledTouchableOpacity
            onPress={() => void navigation.navigate(Routes.SignUpStack.ResetPassword)}
          >
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
