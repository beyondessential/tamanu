import React, { FunctionComponent, useCallback } from 'react';
import {
  FullView,
  RowView,
  CenterView,
  StyledText,
  StyledSafeAreaView,
  StyledView,
} from '../../../styled/common';
import { theme } from '../../../styled/theme';
import { LogoV1Icon } from '../../../components/Icons';
import { Button } from '../../../components/Button';
//helpers
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { Routes } from '../../../helpers/routes';
// Screen
import { IntroScreenProps } from '../../../interfaces/Screens/SignUpStack/Intro';

export const IntroScreen: FunctionComponent<any> = ({ navigation, route }: IntroScreenProps) => {
  const onNavigateToSignIn = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.SignIn);
  }, []);

  const { signedOutFromInactivity } = route.params;

  return (
    <FullView background={theme.colors.WHITE}>
      <StyledSafeAreaView>
        <CenterView marginTop={screenPercentageToDP(13.36, Orientation.Height)}>
          <LogoV1Icon />
        </CenterView>
        <CenterView>
          <StyledView
            height={screenPercentageToDP(2.9, Orientation.Height)}
            marginTop={screenPercentageToDP(12.32, Orientation.Height)}
          >
            {signedOutFromInactivity && (
              <StyledText
                fontSize={`${screenPercentageToDP(1.94, Orientation.Height)}px`}
                color={theme.colors.MAIN_SUPER_DARK}
              >
                You have been logged out due to inactivity.
              </StyledText>
            )}
          </StyledView>
        </CenterView>
        <CenterView marginTop={screenPercentageToDP(11.5, Orientation.Height)}>
          <StyledText
            color={theme.colors.PRIMARY_MAIN}
            fontSize={`${screenPercentageToDP(3.4, Orientation.Height)}px`}
            fontWeight="bold"
          >
            eHealth patient record
          </StyledText>
        </CenterView>
        <StyledText
          marginTop={10}
          color={theme.colors.PRIMARY_MAIN}
          fontSize={`${screenPercentageToDP(1.94, Orientation.Height)}px`}
          textAlign="center"
          marginLeft={screenPercentageToDP(14, Orientation.Width)}
          marginRight={screenPercentageToDP(14, Orientation.Width)}
        >
          For Hospitals, Health Centres and clinics around the world
        </StyledText>
        <RowView
          justifyContent="center"
          marginTop={screenPercentageToDP(13, Orientation.Height)}
        >
          <Button
            id="intro-sign-in-button"
            onPress={onNavigateToSignIn}
            width="140px"
            outline
            borderColor={theme.colors.PRIMARY_MAIN}
            buttonText="Sign in"
            textColor={theme.colors.PRIMARY_MAIN}
            fontWeight={500}
            fontSize={`${screenPercentageToDP(1.94, Orientation.Height)}px`}
          />
          {/* UNIMPLEMENTED <Button
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
          </Button> */}
        </RowView>
        <CenterView marginTop="30px">
          <Button
            height="40px"
            onPress={(): void => console.log('request access..')}
            width="180px"
            backgroundColor={theme.colors.WHITE}
            buttonText="Request Access"
            textColor={theme.colors.PRIMARY_MAIN}
            fontWeight={500}
            fontSize={`${screenPercentageToDP(1.94, Orientation.Height)}px`}
          />
        </CenterView>
      </StyledSafeAreaView>
    </FullView>
  );
};
