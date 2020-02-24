import React, { FunctionComponent as FC } from 'react';
import { KeyboardAvoidingView } from 'react-native';
import Animated from 'react-native-reanimated';
import { AnimatedValue } from 'react-navigation';
import {
  FullView,
  StyledSafeAreaView,
  StyledTouchableOpacity,
  CenterView,
  StyledText,
  RowView,
} from '../../../../styled/common';
import { theme } from '../../../../styled/theme';
import { Cross, User } from '../../../../components/Icons';
import { RegisterAccountFormStep01 } from '../../../../components/Forms/RegisterAccountForms/RegisterAccountFormStep01';
import { Orientation, screenPercentageToDP } from '../../../../helpers/screen';
import { RegisterAccountFormStep1Props } from '../../../../contexts/RegisterAccountContext';
import { StepMarker } from '../../../../components/StepMarker';

interface ScreenProps {
  navigateToIntro: () => void;
  step1FormProps: RegisterAccountFormStep1Props;
  iconSize: AnimatedValue;
  titleFont: AnimatedValue;
  onSubmitForm: (values: RegisterAccountFormStep1Props) => void;
}

export const Screen: FC<ScreenProps> = React.memo((
  {
    navigateToIntro,
    step1FormProps,
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
        <StepMarker step={1} />
      </CenterView>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <RegisterAccountFormStep01
          formState={step1FormProps}
          onSubmit={onSubmitForm}
        />
      </KeyboardAvoidingView>
    </StyledSafeAreaView>
  </FullView>
));
