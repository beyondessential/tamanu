import React, { FunctionComponent } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import Animated from 'react-native-reanimated';
import { AnimatedValue } from 'react-navigation';
//Components
import {
  FullView,
  StyledSafeAreaView,
  StyledTouchableOpacity,
  CenterView,
  StyledText,
  RowView,
} from '/styled/common';
import { Cross, User } from '/components/Icons';
import { RegisterAccountFormStep02 } from '/components/Forms/RegisterAccountForms/RegisterAccountFormStep02';
import { StepMarker } from '/components/StepMarker';
// Theme
import { theme } from '/styled/theme';
//Helpers
import { Orientation, screenPercentageToDP } from '/helpers/screen';
// protocols
import { RegisterAccountFormStep2Props } from '../../../../contexts/RegisterAccountContext';

interface ScreenProps {
  navigateToIntro: () => void;
  step2FormProps: RegisterAccountFormStep2Props;
  iconSize: AnimatedValue;
  titleFont: AnimatedValue;
  navigateFormStepBack: () => void;
  viewTopPosition: AnimatedValue;
  onSubmitForm: (values: RegisterAccountFormStep2Props) => void;
}

export const Screen: FunctionComponent<ScreenProps> = (
  {
    navigateToIntro,
    viewTopPosition,
    step2FormProps,
    navigateFormStepBack,
    iconSize,
    titleFont,
    onSubmitForm,
  }: ScreenProps,
) => (
  <FullView
    background={theme.colors.PRIMARY_MAIN}
  >
    <StyledSafeAreaView flex={1}>
      <RowView
        justifyContent="flex-end"
      >
        <StyledTouchableOpacity
          padding={15}
          onPress={navigateToIntro}
        >
          <Cross size={screenPercentageToDP(2.43, Orientation.Height)} />
        </StyledTouchableOpacity>
      </RowView>
      <CenterView
        as={Animated.View}
        position="absolute"
        width="100%"
        top={viewTopPosition}
      >
        <User size={iconSize} fill={theme.colors.SECONDARY_MAIN} />
        <StyledText
          as={Animated.Text}
          marginTop={10}
          color={theme.colors.WHITE}
          fontSize={titleFont}
          fontWeight="bold"
        >New Account
        </StyledText>
        <StepMarker step={2} />
      </CenterView>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <RegisterAccountFormStep02
          formState={step2FormProps}
          onSubmit={onSubmitForm}
          navigateFormStepBack={navigateFormStepBack}
        />
      </KeyboardAvoidingView>
    </StyledSafeAreaView>
  </FullView>
);
