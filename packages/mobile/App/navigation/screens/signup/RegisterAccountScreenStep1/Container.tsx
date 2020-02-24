import React, { FC, useState, useMemo, useCallback, useContext } from 'react';
import { Keyboard } from 'react-native';
import { Value } from 'react-native-reanimated';
//Protocols
import { RegisterAccountScreenProps } from '../../../../interfaces/screens/SignUpStack/RegisterAccountStep1Props';
// contexts
import { RegisterAccountFormStep1Props, RegisterAccountContext } from '../../../../contexts/RegisterAccountContext';
//helpers
import { onKeyboardOpenListener, onKeyboardCloseListener } from '../../../../helpers/keyboard';
import { animateState } from '../../../../helpers/animation';
import { screenPercentageToDP, Orientation } from '../../../../helpers/screen';
import { Routes } from '../../../../helpers/constants';
//Screen
import { Screen } from './Screen';

export const RegisterAccountStep1Container: FC<any> = ({
  navigation,
}: RegisterAccountScreenProps) => {
  const {
    registerFormState,
    updateForm } = useContext(RegisterAccountContext);

  const [iconSize] = useState(new Value(60));
  const [titleFont] = useState(new Value(screenPercentageToDP('2.55', Orientation.Height)));

  const step1FormProps = useMemo<RegisterAccountFormStep1Props>(() => ({
    firstName: registerFormState.firstName,
    lastName: registerFormState.lastName,
    email: registerFormState.email,
    phone: registerFormState.phone,
    gender: registerFormState.gender,
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

  const onSubmitForm = useCallback(
    (values) => {
      Keyboard.dismiss();
      updateForm(values);
      navigation.navigate(Routes.SignUpStack.RegisterAccountStep2);
    },
    [],
  );

  return (
    <Screen
      iconSize={iconSize}
      navigateToIntro={navigateToIntro}
      onSubmitForm={onSubmitForm}

      step1FormProps={step1FormProps}
      titleFont={titleFont}
    />
  );
};
