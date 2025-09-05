import React, { FunctionComponent, ReactElement, useCallback } from 'react';
import { KeyboardAvoidingView, StatusBar } from 'react-native';
import {
  StyledView,
  StyledSafeAreaView,
  FullView,
  StyledTouchableOpacity,
  StyledText,
  RowView,
} from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { Routes } from '/helpers/routes';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { ArrowLeftIcon } from '~/ui/components/Icons';
import { FlatList, TouchableHighlight } from 'react-native-gesture-handler';
import { Separator } from '~/ui/components/Separator';
import { isISO31661Alpha2 } from 'validator';
import CountryFlag from 'react-native-country-flag';

const StyledSeparator = () => (
  <Separator
    paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
    paddingRight={screenPercentageToDP(4.86, Orientation.Width)}
  />
);

interface LanguageOptionButtonProps {
  label: string;
  languageCode: string;
  countryCode: string | null;
  onPress: (value: string) => void;
}

const LanguageOptionButton = ({
  label,
  languageCode,
  countryCode,
  onPress,
}: LanguageOptionButtonProps): React.ReactElement => {
  const handlePress = () => {
    onPress(languageCode);
  };

  return (
    <TouchableHighlight underlayColor={theme.colors.DEFAULT_OFF} onPress={handlePress}>
      <RowView
        width="100%"
        height={screenPercentageToDP(6.5, Orientation.Height)}
        paddingLeft={screenPercentageToDP(4.86, Orientation.Width)}
        alignItems="center"
      >
        <StyledView marginRight={screenPercentageToDP(3.4, Orientation.Width)}>
          {countryCode && isISO31661Alpha2(countryCode) && (
            <CountryFlag isoCode={countryCode} size={34} />
          )}
        </StyledView>
        <RowView flex={1}>
          <StyledText
            color={theme.colors.TEXT_SUPER_DARK}
            fontSize={screenPercentageToDP(2, Orientation.Height)}
          >
            {label}
          </StyledText>
        </RowView>
      </RowView>
    </TouchableHighlight>
  );
};

export default LanguageOptionButton;

export const LanguageSelectScreen: FunctionComponent<any> = ({ navigation }) => {
  const { languageOptions, setLanguage } = useTranslation();

  const onNavigateToSignIn = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.SignIn);
  }, [navigation]);

  const handleChangeLanguage = (value: string) => {
    setLanguage(value);
    onNavigateToSignIn();
  };

  if (!languageOptions) {
    return <ErrorScreen error={{ message: 'Problem loading language list' }} />;
  }

  return (
    <FullView background={theme.colors.WHITE}>
      <StatusBar barStyle="light-content" />
      <StyledSafeAreaView>
        <KeyboardAvoidingView behavior="position">
          <StyledView
            width="100%"
            alignItems="flex-start"
            marginTop={screenPercentageToDP(3.39, Orientation.Height)}
            marginBottom={screenPercentageToDP(2, Orientation.Height)}
            marginLeft={screenPercentageToDP(5.84, Orientation.Width)}
          >
            <StyledTouchableOpacity onPress={onNavigateToSignIn}>
              <ArrowLeftIcon
                fill={theme.colors.PRIMARY_MAIN}
                size={screenPercentageToDP(7.79, Orientation.Width)}
              />
            </StyledTouchableOpacity>
            <StyledText
              marginTop={screenPercentageToDP(3.77, Orientation.Height)}
              fontSize={screenPercentageToDP(3.55, Orientation.Height)}
              color={theme.colors.TEXT_DARK}
              fontWeight="bold"
            >
              Choose language
            </StyledText>
          </StyledView>
          <Separator marginBottom={screenPercentageToDP(2.39, Orientation.Height)} />
          <StyledView
            marginLeft={screenPercentageToDP(3, Orientation.Width)}
            marginRight={screenPercentageToDP(3, Orientation.Width)}
            marginBottom={screenPercentageToDP(4, Orientation.Height)}
            maxHeight={screenPercentageToDP(70, Orientation.Height)}
          >
            <FlatList
              data={languageOptions}
              keyExtractor={(item): string => item.languageCode}
              renderItem={({ item }): ReactElement => (
                <LanguageOptionButton onPress={handleChangeLanguage} {...item} />
              )}
              ItemSeparatorComponent={StyledSeparator}
              scrollEnabled={true}
            />
            {languageOptions && <StyledSeparator />}
          </StyledView>
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </FullView>
  );
};
