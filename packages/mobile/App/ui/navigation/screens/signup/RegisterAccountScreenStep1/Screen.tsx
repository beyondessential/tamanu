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
} from '/styled/common';
import { theme } from '/styled/theme';
import { CrossIcon } from '/components/Icons';
import { RegisterAccountFormStep01 } from '/components/Forms/RegisterAccountForms/RegisterAccountFormStep01';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { RegisterAccountFormStep1Props } from '../../../../contexts/RegisterAccountContext';
import { StepMarker } from '/components/StepMarker';
import { UserIconContainer } from '../common';

interface ScreenProps {
  navigateToIntro: () => void;
  step1FormProps: RegisterAccountFormStep1Props;
  iconSize: AnimatedValue;
  titleFont: AnimatedValue;
  iconContainerPosition: AnimatedValue;
  onSubmitForm: (values: RegisterAccountFormStep1Props) => void;
}

export const Screen: FC<ScreenProps> = React.memo(
  ({
    navigateToIntro,
    step1FormProps,
    iconSize,
    titleFont,
    onSubmitForm,
    iconContainerPosition,
  }: ScreenProps) => (
    <StyledSafeAreaView flex={1} background={theme.colors.PRIMARY_MAIN}>
      <FullView background={theme.colors.PRIMARY_MAIN}>
        <RowView justifyContent="flex-end">
          <StyledTouchableOpacity padding={15} onPress={navigateToIntro}>
            <CrossIcon size={screenPercentageToDP(2.43, Orientation.Height)} />
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
          <StepMarker step={1} />
        </CenterView>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <RegisterAccountFormStep01
            formState={step1FormProps}
            onSubmit={onSubmitForm}
          />
        </KeyboardAvoidingView>
      </FullView>
    </StyledSafeAreaView>
  ),
);
