import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
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
import { ModalInfo } from '/components/ModalInfo';
import { Dropdown } from '~/ui/components/Dropdown';
import { useBackend } from '~/ui/hooks';
import { useTranslation } from '~/ui/contexts/TranslationContext';

export const LanguageSelectScreen: FunctionComponent<any> = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { language, onChangeLanguage } = useTranslation();

  const [languageOptions, setLanguageOptions] = useState([]);

  const {
    models: { TranslatedString },
  } = useBackend();

  useEffect(() => {
    (async () => {
      const languageOptions = await TranslatedString.getLanguageOptions();
      if (languageOptions.length === 0) {
        setModalError('Error loading language list');
        return;
      }
      setLanguageOptions(languageOptions);
    })();
  }, []);

  const onNavigateToSignIn = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.SignIn);
  }, []);

  const onChangeModalVisibility = useCallback((isVisible: boolean) => {
    setModalVisible(isVisible);
  }, []);

  const setModalError = useCallback((message: string) => {
    setErrorMessage(message);
    onChangeModalVisibility(true);
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
              onChange={onChangeLanguage}
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
              marginTop={screenPercentageToDP('2.43', Orientation.Height)}
              marginBottom={screenPercentageToDP('4.86', Orientation.Height)}
              fontSize={screenPercentageToDP('1.57', Orientation.Height)}
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
