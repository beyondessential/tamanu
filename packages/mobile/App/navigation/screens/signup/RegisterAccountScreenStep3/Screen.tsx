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
import { RegisterAccountFormStep03 } from '/components/Forms/RegisterAccountForms/RegisterAccountFormStep03';
import { StepMarker } from '/components/StepMarker';
// Theme
import { theme } from '/styled/theme';
//Helpers
import { Orientation, screenPercentageToDP } from '/helpers/screen';
// protocols
import { RegisterAccountFormStep3Props } from '../../../../contexts/RegisterAccountContext';

interface ScreenProps {
  navigateToIntro: () => void;
  step3FormProps: RegisterAccountFormStep3Props;
  iconSize: AnimatedValue;
  titleFont: AnimatedValue;
  iconContainerPosition: AnimatedValue;
  navigateFormStepBack: () => void;
  onSubmitForm: (values: RegisterAccountFormStep3Props) => void;
}

export const Screen: FunctionComponent<ScreenProps> = ({
         navigateToIntro,
         step3FormProps,
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
                 <Cross size={screenPercentageToDP(2.43, Orientation.Height)} />
               </StyledTouchableOpacity>
             </RowView>
             <CenterView
               as={Animated.View}
               position="absolute"
               width="100%"
               top={iconContainerPosition}
             >
               <User size={iconSize} fill={theme.colors.SECONDARY_MAIN} />
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
                 formState={step3FormProps}
                 onSubmit={onSubmitForm}
                 navigateFormStepBack={navigateFormStepBack}
               />
             </KeyboardAvoidingView>
           </FullView>
         </StyledSafeAreaView>
       );
