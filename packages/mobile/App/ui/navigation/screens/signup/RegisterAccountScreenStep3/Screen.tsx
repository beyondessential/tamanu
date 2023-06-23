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
import { RegisterAccountFormStep03 } from '/components/Forms/RegisterAccountForms/RegisterAccountFormStep03';
import { StepMarker } from '/components/StepMarker';
// Theme
import { theme } from '/styled/theme';
//Helpers
import { Orientation, screenPercentageToDP } from '/helpers/screen';
// protocols
import { RegisterAccountFormStep3FormValues } from '../../../../contexts/RegisterAccountContext';
import { UserIconContainer } from '../common';

interface ScreenProps {
  navigateToIntro: () => void;
  step3FormValues: RegisterAccountFormStep3FormValues;
  iconSize: Value<number>;
  titleFont: Value<number>;
  iconContainerPosition: Value<number>;
  navigateFormStepBack: () => void;
  onSubmitForm: (values: RegisterAccountFormStep3FormValues) => void;
}

export const Screen: FunctionComponent<ScreenProps> = ({
  navigateToIntro,
  step3FormValues,
  navigateFormStepBack,
  iconSize,
  titleFont,
  onSubmitForm,
  iconContainerPosition,
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
        top={iconContainerPosition}
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
        <StepMarker step={3} />
      </CenterView>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <RegisterAccountFormStep03
          formState={step3FormValues}
          onSubmit={onSubmitForm}
          navigateFormStepBack={navigateFormStepBack}
        />
      </KeyboardAvoidingView>
    </FullView>
  </StyledSafeAreaView>
);
