import React, { FunctionComponent } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import Animated, { Value } from 'react-native-reanimated';
//Components
import {
  FullView,
  StyledSafeAreaView,
  StyledTouchableOpacity,
  CenterView,
  StyledText,
  RowView,
} from '/styled/common';
import { CrossIcon } from '/components/Icons';
import { RegisterAccountFormStep02 } from '/components/Forms/RegisterAccountForms/RegisterAccountFormStep02';
import { StepMarker } from '/components/StepMarker';
// Theme
import { theme } from '/styled/theme';
//Helpers
import { Orientation, screenPercentageToDP } from '/helpers/screen';
// protocols
import { RegisterAccountFormStep2FormValues } from '../../../../contexts/RegisterAccountContext';
import { UserIconContainer } from '../common';

interface ScreenProps {
  navigateToIntro: () => void;
  step2FormValues: RegisterAccountFormStep2FormValues;
  iconSize: Value<number>;
  titleFont: Value<number>;
  navigateFormStepBack: () => void;
  viewTopPosition: Value<number>;
  onSubmitForm: (values: RegisterAccountFormStep2FormValues) => void;
}

export const Screen = ({
  navigateToIntro,
  viewTopPosition,
  step2FormValues,
  navigateFormStepBack,
  iconSize,
  titleFont,
  onSubmitForm,
}: ScreenProps): JSX.Element => (
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
          formState={step2FormValues}
          onSubmit={onSubmitForm}
          navigateFormStepBack={navigateFormStepBack}
        />
      </KeyboardAvoidingView>
    </FullView>
  </StyledSafeAreaView>
);
