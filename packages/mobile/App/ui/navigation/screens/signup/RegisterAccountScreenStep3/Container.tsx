import React, { FC, useState, useMemo, useCallback, useContext } from 'react';
import { Value } from 'react-native-reanimated';
import { Keyboard } from 'react-native';
//Protocols
import { RegisterAccountScreenProps } from '../../../../interfaces/screens/SignUpStack/RegisterAccountStep1Props';
// context
import {
  RegisterAccountContext,
  RegisterAccountFormStep3FormValues,
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

export const RegisterAccountStep3Container: FC<any> = ({
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

  const step3FormValues = useMemo<RegisterAccountFormStep3FormValues>(
    () => ({
      password: registerFormState.password,
      confirmPassword: registerFormState.confirmPassword,
      readPrivacyPolice: registerFormState.readPrivacyPolice,
    }),
    [],
  );

  onKeyboardOpenListener(() => {
    animateState(viewTopPosition, 5, 300);
    animateState(iconSize, 30, 300);
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

  const navigateFormStepBack = useCallback(() => {
    navigation.navigate(Routes.SignUpStack.RegisterAccountStep2);
  }, []);

  const onSubmitForm = useCallback(values => {
    Keyboard.dismiss();
    updateForm(values);
    navigation.navigate(Routes.HomeStack.Index);
  }, []);

  return (
    <Screen
      iconSize={iconSize}
      navigateToIntro={navigateToIntro}
      navigateFormStepBack={navigateFormStepBack}
      onSubmitForm={onSubmitForm}
      step3FormValues={step3FormValues}
      titleFont={titleFont}
      iconContainerPosition={viewTopPosition}
    />
  );
};
