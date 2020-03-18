import React, { useCallback, useMemo } from 'react';
//Components
import {
  StyledSafeAreaView,
  StyledText,
  StyledView,
  CenterView,
} from '/styled/common';
import { AppIntro1, AppIntro2, AppIntro3 } from '/components/Icons';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { theme } from '/styled/theme';
import { StepMarker } from '/components/StepMarker';
import { Button } from '/components/Button';
//helpers
import { disableAndroidBackButton } from '/helpers/android';
// Props
import { NavigationProp } from '@react-navigation/native';
import { IntroScreenProps } from '/interfaces/screens/HomeStack';


export interface IntroRouteProps {
  user: { name: string };
  message: string;
  title: string;
  nextRoute: string | '';
  step: number;
}

interface IntroProps {
  navigation: NavigationProp<any>;
  route: {
    params: IntroRouteProps;
  };
}


const isFirstStep = (step: number): void => {
  if (step === 1) {
    disableAndroidBackButton();
  }
};

export const Intro = (props: IntroScreenProps): JSX.Element => {
  const { navigation, route } = props;
  const { user, title, message, step, nextRoute } = route.params;

  isFirstStep(step);

  const Icon = useMemo(() => {
    switch (step) {
      case 1:
        return AppIntro1;
      case 2:
        return AppIntro2;
      case 3:
        return AppIntro3;
      default:
        return AppIntro1;
    }
  }, []);

  const onPressButton = useCallback(() => {
    navigation.navigate(nextRoute);
  }, []);

  return (
    <StyledSafeAreaView
      flex={1}
      background={theme.colors.PRIMARY_MAIN}
      alignItems="center"
    >
      <StyledText
        marginTop={screenPercentageToDP('11.05', Orientation.Height)}
        fontSize={21}
        fontWeight="bold"
        color={theme.colors.WHITE}
      >
        Welcome, John!
      </StyledText>
      <StyledView marginTop={screenPercentageToDP('11.17', Orientation.Height)}>
        <Icon />
      </StyledView>
      <StyledText
        marginTop={screenPercentageToDP('7.29', Orientation.Height)}
        color={theme.colors.WHITE}
        fontWeight="bold"
        fontSize={18}
      >
        {title}
      </StyledText>
      <StyledText
        marginLeft={screenPercentageToDP('12.16', Orientation.Width)}
        marginRight={screenPercentageToDP('12.16', Orientation.Width)}
        textAlign="center"
        marginTop={screenPercentageToDP('1.21', Orientation.Height)}
        color={theme.colors.WHITE}
      >
        {message}
      </StyledText>
      <CenterView marginTop={50}>
        <StepMarker step={step} />
        <Button
          marginTop={screenPercentageToDP(6.0, Orientation.Height)}
          width={screenPercentageToDP(43.79, Orientation.Width)}
          outline
          borderColor={theme.colors.WHITE}
          buttonText="skip"
          onPress={onPressButton}
        />
      </CenterView>
    </StyledSafeAreaView>
  );
};
