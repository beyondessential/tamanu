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
import { CrossIcon, UserIcon } from '/components/Icons';
import { RegisterAccountFormStep02 } from '/components/Forms/RegisterAccountForms/RegisterAccountFormStep02';
import { StepMarker } from '/components/StepMarker';
// Theme
import { theme } from '/styled/theme';
//Helpers
import { Orientation, screenPercentageToDP } from '/helpers/screen';
// protocols
import { RegisterAccountFormStep2Props } from '../../../../contexts/RegisterAccountContext';
import { UserIconContainer } from '../common';

interface ScreenProps {
  navigateToIntro: () => void;
  step2FormProps: RegisterAccountFormStep2Props;
  iconSize: AnimatedValue;
  titleFont: AnimatedValue;
  navigateFormStepBack: () => void;
  viewTopPosition: AnimatedValue;
  onSubmitForm: (values: RegisterAccountFormStep2Props) => void;
}

export const Screen: FunctionComponent<ScreenProps> = ({
  navigateToIntro,
  viewTopPosition,
  step2FormProps,
  navigateFormStepBack,
  iconSize,
  titleFont,
  onSubmitForm,
}: ScreenProps) => (
  <StyledSafeAreaView flex={1} background={theme.colors.PRIMARY_MAIN}>
    <FullView background={theme.colors.PRIMARY_MAIN}>
      <RowView justifyContent="flex-end">
        <StyledTouchableOpacity padding={15} onPress={navigateToIntro}>
          <CrossIcon
            width={screenPercentageToDP(2.43, Orientation.Height)}
            height={screenPercentageToDP(2.43, Orientation.Height)}
          />
        </StyledTouchableOpacity>
      </RowView>
      <CenterView
        as={Animated.View}
        position="absolute"
        width="100%"
        top={viewTopPosition}
      >
        <UserIconContainer size={iconSize} />
        <StyledText
          as={Animated.Text}
          marginTop={10}
          color={theme.colors.WHITE}
          fontSize={titleFont}
          fontWeight="bold"
        >
          New Account
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
    </FullView>
  </StyledSafeAreaView>
);
