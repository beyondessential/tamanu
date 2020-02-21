import React, { FunctionComponent, useState } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { AnimatedValue } from 'react-navigation';
import {
  FullView,
  StyledSafeAreaView,
  StyledTouchableOpacity,
  StyledView,
  CenterView,
  StyledText,
  RowView,
} from '../../../styled/common';
import { Cross, User } from '../../../components/Icons';
import { theme } from '../../../styled/theme';
import { RegisterAccountStep1Props } from '../../../interfaces/screens/SignUpStack/RegisterAccountStep1Props';
import { Routes } from '../../../helpers/constants';
import { RegisterAccountStep01 } from '../../../components/Forms/RegisterAccountForms/RegisterAccountStep01';
import { Orientation, screenPercentageToDP } from '../../../helpers/screen';
import { onKeyboardCloseListener, onKeyboardOpenListener } from '../../../helpers/keyboard';

const { Value, timing } = Animated;

interface Circle {
  currentStep?: boolean
}

export const Circle: FunctionComponent<any> = ({ currentStep = false }:Circle) => (
  <StyledView
    width={10}
    height={10}
    borderRadius={50}
    background={currentStep ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE}
  />
);


const StepMarker: FunctionComponent<any> = () => (
  <RowView
    justifyContent="space-around"
    width={60}
    marginTop={10}
  >
    <Circle currentStep />
    <Circle />
    <Circle />
  </RowView>
);

const animateElement = (animatedValue: AnimatedValue, toValue: number): void => {
  timing(animatedValue, {
    duration: 300,
    toValue,
    easing: Easing.in(Easing.linear),
  }).start();
};


export const RegisterAccount: FunctionComponent<any> = (
  {
    navigation,
  }: RegisterAccountStep1Props,
) => {
  const [iconSize] = useState(new Value(60));
  const [titleFont] = useState(new Value(screenPercentageToDP('2.55', Orientation.Height)));


  onKeyboardOpenListener(() => {
    animateElement(iconSize, 30);
    animateElement(titleFont, screenPercentageToDP('1.55', Orientation.Height));
  });
  onKeyboardCloseListener(() => {
    animateElement(iconSize, 60);
    animateElement(titleFont, screenPercentageToDP('2.55', Orientation.Height));
  });

  return (
    <FullView
      background={theme.colors.PRIMARY_MAIN}
    >
      <StyledSafeAreaView flex={1}>
        <RowView
          justifyContent="flex-end"
        >
          <StyledTouchableOpacity
            padding={15}
            onPress={(): void => navigation.navigate(Routes.SignUpStack.Intro)}
          >
            <Cross size={screenPercentageToDP(2.43, Orientation.Height)} />
          </StyledTouchableOpacity>
        </RowView>
        <CenterView>
          <User size={iconSize} fill={theme.colors.SECONDARY_MAIN} />
          <StyledText
            as={Animated.Text}
            marginTop={10}
            color={theme.colors.WHITE}
            fontSize={titleFont}
            fontWeight="bold"
          >New Account
          </StyledText>
          <StepMarker />
        </CenterView>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <RegisterAccountStep01 navigation={navigation} />
        </KeyboardAvoidingView>
      </StyledSafeAreaView>
    </FullView>
  );
};
