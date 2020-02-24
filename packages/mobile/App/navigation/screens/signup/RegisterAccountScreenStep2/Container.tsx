import React, { FC, useState, useMemo, useCallback, useContext } from 'react';
import { Value } from 'react-native-reanimated';
import { Keyboard } from 'react-native';
//Protocols
import { RegisterAccountScreenProps } from '../../../../interfaces/screens/SignUpStack/RegisterAccountStep1Props';
// contexts
import { RegisterAccountContext, RegisterAccountFormStep2Props } from '../../../../contexts/RegisterAccountContext';
//helpers
import { onKeyboardOpenListener, onKeyboardCloseListener } from '../../../../helpers/keyboard';
import { animateState } from '../../../../helpers/animation';
import { screenPercentageToDP, Orientation } from '../../../../helpers/screen';
import { Routes } from '../../../../helpers/constants';
//Screen
import { Screen } from './Screen';

export const RegisterAccountStep2Container: FC<any> = ({
  navigation,
}: RegisterAccountScreenProps) => {
  const {
    registerFormState,
    updateForm } = useContext(RegisterAccountContext);

  const [iconSize] = useState(new Value(60));
  const [titleFont] = useState(new Value(screenPercentageToDP('2.55', Orientation.Height)));
  const [viewTopPosition] = useState(new Value(80));

  const step2FormProps = useMemo<RegisterAccountFormStep2Props>(() => ({
    role: registerFormState.role,
    homeFacility: registerFormState.homeFacility,
    profession: registerFormState.profession,
    professionalRegistrationNumber: registerFormState.professionalRegistrationNumber,
    firstYearOfRegistration: registerFormState.firstYearOfRegistration,
  }), []);


  onKeyboardOpenListener(() => {
    animateState(viewTopPosition, 35, 300);
    animateState(iconSize, 30, 300);
    animateState(titleFont, screenPercentageToDP('1.55', Orientation.Height), 300);
  });
  onKeyboardCloseListener(() => {
    animateState(viewTopPosition, 80, 300);
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
      navigation.navigate(Routes.SignUpStack.RegisterAccountStep1);
    },
    [],
  );

  const onSubmitForm = useCallback(
    (values) => {
      Keyboard.dismiss();
      updateForm(values);
      navigation.navigate(Routes.SignUpStack.RegisterAccountStep3);
    },
    [],
  );

  return (
    <Screen
      iconSize={iconSize}
      navigateToIntro={navigateToIntro}
      navigateFormStepBack={navigateFormStepBack}
      onSubmitForm={onSubmitForm}
      step2FormProps={step2FormProps}
      viewTopPosition={viewTopPosition}
      titleFont={titleFont}
    />
  );
};
