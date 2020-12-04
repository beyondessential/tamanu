import React, { FunctionComponent, useCallback } from 'react';
import {
  FullView,
  RowView,
  CenterView,
  StyledText,
  StyledSafeAreaView,
} from '/styled/common';
import { LogoV1Icon } from '/components/Icons';
import { Button } from '/components/Button';
//helpers
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { Routes } from '/helpers/routes';
import { theme } from '/styled/theme';
// Screen
import { IntroScreenProps } from '/interfaces/screens/SignUpStack/Intro';

export const IntroScreen: FunctionComponent<any> = ({
  navigation,
}: IntroScreenProps) => {
  const onNavigateToNewAccount = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.RegisterAccountStep1);
  }, []);

  const onNavigateToSignIn = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.SignIn);
  }, []);

  return (
    <FullView background={theme.colors.WHITE}>
      <StyledSafeAreaView>
        <CenterView marginTop={screenPercentageToDP(13.36, Orientation.Height)}>
          <LogoV1Icon />
        </CenterView>
        <CenterView marginTop={screenPercentageToDP(26.36, Orientation.Height)}>
          <StyledText
            color={theme.colors.PRIMARY_MAIN}
            fontSize={`${screenPercentageToDP('3.4', Orientation.Height)}px`}
            fontWeight="bold"
          >
            eHealth patient record
          </StyledText>
        </CenterView>
        <StyledText
          marginTop={10}
          color={theme.colors.PRIMARY_MAIN}
          fontSize={`${screenPercentageToDP('1.94', Orientation.Height)}px`}
          textAlign="center"
          marginLeft={screenPercentageToDP('14', Orientation.Width)}
          marginRight={screenPercentageToDP('14', Orientation.Width)}
        >
          For Hospitals, Health Centres and clinics around the world
        </StyledText>
        <RowView
          justifyContent="center"
          marginTop={screenPercentageToDP('13.00', Orientation.Height)}
        >
          <Button
            id="intro-sign-in-button"
            onPress={onNavigateToSignIn}
            width={`${140}px`}
            outline
            borderColor={theme.colors.PRIMARY_MAIN}
            marginRight={screenPercentageToDP('2.43', Orientation.Width)}
            buttonText="Sign in"
            textColor={theme.colors.PRIMARY_MAIN}
            fontWeight={500}
            fontSize={`${screenPercentageToDP(1.94, Orientation.Height)}px`}
          />
          <Button
            id="intro-new-account-button"
            backgroundColor={theme.colors.SECONDARY_MAIN}
            onPress={onNavigateToNewAccount}
            width={`${140}px`}
          >
            <StyledText
              fontWeight={500}
              fontSize={`${screenPercentageToDP(
                '1.94',
                Orientation.Height,
              )}px`}
            >
              New Account
            </StyledText>
          </Button>
        </RowView>
        <CenterView marginTop={30}>
          <Button
            height={`${40}px`}
            onPress={(): void => console.log('request access..')}
            width={`${140}px`}
            backgroundColor={theme.colors.WHITE}
          >
            <StyledText
              fontSize={`${screenPercentageToDP('1.94', Orientation.Height)}px`}
              color={theme.colors.PRIMARY_MAIN}
            >
              Request Access
            </StyledText>
          </Button>
        </CenterView>
      </StyledSafeAreaView>
    </FullView>
  );
};
