import React, { FunctionComponent, useCallback } from 'react';
import { KeyboardAvoidingView, StatusBar } from 'react-native';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  StyledTouchableOpacity,
  StyledText,
} from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { Routes } from '/helpers/routes';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { Dropdown } from '~/ui/components/Dropdown';
import { useTranslation } from '~/ui/contexts/TranslationContext';

export const LanguageSelectScreen: FunctionComponent<any> = ({ navigation }) => {
  const { language, languageOptions, setLanguage } = useTranslation();

  const onNavigateToSignIn = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.SignIn);
  }, []);

  if (!languageOptions) {
    return <ErrorScreen error={{ message: 'Problem loading language list' }} />;
  }

  return (
    <FullView background={theme.colors.PRIMARY_MAIN}>
      <StatusBar barStyle="light-content" />
      <StyledSafeAreaView>
        <KeyboardAvoidingView behavior="position">
          <StyledView
            width="100%"
            alignItems="center"
            marginTop={screenPercentageToDP(7.29, Orientation.Height)}
            marginBottom={screenPercentageToDP(4, Orientation.Height)}
          >
            <StyledText
              marginTop={screenPercentageToDP(2.43, Orientation.Height)}
              fontSize={screenPercentageToDP(2.55, Orientation.Height)}
              color={theme.colors.WHITE}
              fontWeight="bold"
            >
              Choose language
            </StyledText>
          </StyledView>
          <StyledView
            marginLeft={screenPercentageToDP(3, Orientation.Width)}
            marginRight={screenPercentageToDP(3, Orientation.Width)}
            marginBottom={screenPercentageToDP(4, Orientation.Height)}
            height={screenPercentageToDP(5.46, Orientation.Height)}
          >
            <Dropdown
              value={language}
              options={languageOptions}
              onChange={setLanguage}
              label=""
              fixedHeight
              selectPlaceholderText="Select"
              labelColor="white"
              clearable={false}
            />
          </StyledView>
          <StyledTouchableOpacity onPress={onNavigateToSignIn}>
            <StyledText
              width="100%"
              textAlign="center"
              marginBottom={screenPercentageToDP(4.86, Orientation.Height)}
              fontSize={screenPercentageToDP(1.57, Orientation.Height)}
              color={theme.colors.SECONDARY_MAIN}
            >
              Back
            </StyledText>
          </StyledTouchableOpacity>
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </FullView>
  );
};
