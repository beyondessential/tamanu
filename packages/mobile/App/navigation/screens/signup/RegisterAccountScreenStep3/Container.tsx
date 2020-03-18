import React, { FC, useState, useMemo, useCallback, useContext } from 'react';
import { Value } from 'react-native-reanimated';
import { Keyboard } from 'react-native';
//Protocols
import { RegisterAccountScreenProps } from '/interfaces/screens/SignUpStack/RegisterAccountStep1Props';
// context
import { RegisterAccountContext, RegisterAccountFormStep3Props } from '../../../../contexts/RegisterAccountContext';
//helpers
import { onKeyboardOpenListener, onKeyboardCloseListener } from '/helpers/keyboard';
import { animateState } from '/helpers/animation';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Routes } from '/helpers/constants';
//Screen
import { Screen } from './Screen';

export const RegisterAccountStep3Container: FC<any> = ({
  navigation,
}: RegisterAccountScreenProps) => {
  const {
    registerFormState,
    updateForm } = useContext(RegisterAccountContext);


  const [iconSize] = useState(new Value(60));
  const [titleFont] = useState(new Value(screenPercentageToDP('2.55', Orientation.Height)));

  const step3FormProps = useMemo<RegisterAccountFormStep3Props>(() => ({
    password: registerFormState.password,
    confirmPassword: registerFormState.confirmPassword,
    readPrivacyPolice: registerFormState.readPrivacyPolice,
  }), []);


  onKeyboardOpenListener(() => {
    animateState(iconSize, 30, 300);
    animateState(titleFont, screenPercentageToDP('1.55', Orientation.Height), 300);
  });
  onKeyboardCloseListener(() => {
    animateState(iconSize, 60, 300);
    animateState(titleFont, screenPercentageToDP('2.55', Orientation.Height), 300);
  });

  const navigateToIntro = useCallback(
    () => {
      navigation.navigate(Routes.SignUpStack.Intro);
    },
    [],
  );

  const navigateFormStepBack = useCallback(
    () => {
      navigation.navigate(Routes.SignUpStack.RegisterAccountStep2);
    },
    [],
  );

  const onSubmitForm = useCallback(
    (values) => {
      Keyboard.dismiss();
      updateForm(values);
      navigation.navigate(Routes.HomeStack.name);
    },
    [],
  );

  return (
    <Screen
      iconSize={iconSize}
      navigateToIntro={navigateToIntro}
      navigateFormStepBack={navigateFormStepBack}
      onSubmitForm={onSubmitForm}
      step3FormProps={step3FormProps}
      titleFont={titleFont}
    />
  );
};
