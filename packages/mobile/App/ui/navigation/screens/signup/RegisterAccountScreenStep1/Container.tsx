import React, { FC, useState, useMemo, useCallback, useContext } from 'react';
import { Keyboard } from 'react-native';
import { Value } from 'react-native-reanimated';
//Protocols
import { RegisterAccountScreenProps } from '../../../../interfaces/screens/SignUpStack/RegisterAccountStep1Props';
// contexts
import {

  RegisterAccountContext,
  RegisterAccountFormStep1FormValues,
} from '../../../../contexts/RegisterAccountContext';
//helpers
import {
  onKeyboardOpenListener,
  onKeyboardCloseListener,
} from '/helpers/keyboard';
import { animateState } from '/helpers/animation';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Routes } from '/helpers/routes';
//Screen
import { Screen } from './Screen';

export const RegisterAccountStep1Container: FC<any> = ({
  navigation,
}: RegisterAccountScreenProps) => {
  const { registerFormState, updateForm } = useContext(RegisterAccountContext);

  const [iconSize] = useState(
    new Value(screenPercentageToDP('7.29', Orientation.Height)),
  );
  const [titleFont] = useState(
    new Value(screenPercentageToDP('2.55', Orientation.Height)),
  );
  const [viewTopPosition] = useState(
    new Value(screenPercentageToDP(4.43, Orientation.Height)),
  );

  const step1FormValues = useMemo<RegisterAccountFormStep1FormValues>(
    () => ({
      firstName: registerFormState.firstName,
      lastName: registerFormState.lastName,
      email: registerFormState.email,
      phone: registerFormState.phone,
      gender: registerFormState.gender,
    }),
    [],
  );

  onKeyboardOpenListener(() => {
    animateState(viewTopPosition, 5, 300);
    animateState(
      iconSize,
      screenPercentageToDP('3.64', Orientation.Height),
      300,
    );
    animateState(
      titleFont,
      screenPercentageToDP('1.55', Orientation.Height),
      300,
    );
  });
  onKeyboardCloseListener(() => {
    animateState(viewTopPosition, 20, 300);
    animateState(
      iconSize,
      screenPercentageToDP('7.29', Orientation.Height),
      300,
    );
    animateState(
      titleFont,
      screenPercentageToDP('2.55', Orientation.Height),
      300,
    );
  });

  const navigateToIntro = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.Intro);
  }, []);

  const onSubmitForm = useCallback(values => {
    Keyboard.dismiss();
    updateForm(values);
    navigation.navigate(Routes.SignUpStack.RegisterAccountStep2);
  }, []);

  return (
    <Screen
      iconSize={iconSize}
      navigateToIntro={navigateToIntro}
      onSubmitForm={onSubmitForm}
      step1FormValues={step1FormValues}
      iconContainerPosition={viewTopPosition}
      titleFont={titleFont}
    />
  );
};
