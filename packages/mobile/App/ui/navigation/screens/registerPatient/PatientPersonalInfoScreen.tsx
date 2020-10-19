import React, { useCallback, ReactElement } from 'react';
import { StatusBar } from 'react-native';
import { useField, useFormikContext } from 'formik';
import { FullView } from '/styled/common';
import { Header } from './CommonComponents/Header';
import { PatientPersonalInfoForm } from '/components/Forms/NewPatientForm/PatientPersonalInfoForm';
import { theme } from '/styled/theme';
import { Routes } from '/helpers/routes';
import { PatientPersonalInfoScreenProps } from '../../../interfaces/screens/RegisterPatientStack/PatientPersonalInfoScreen';

const currentScreenFields = [
  'firstName',
  'middleName',
  'lastName',
  'email',
  'phone',
  'province',
  'city',
  'address',
];

export const PatientPersonalInfoScreen = ({
  navigation,
}: PatientPersonalInfoScreenProps): ReactElement => {
  const onGoBack = useCallback(() => {
    navigation.navigate(Routes.HomeStack.HomeTabs.Index);
  }, []);
  const screenFields = currentScreenFields.map(fieldName => useField(fieldName));
  const form = useFormikContext();

  const validateForm = useCallback((): boolean => {
    const isFormValid = screenFields.every(field => {
      const noError = field[1].error === undefined;
      const hasNotBeenTouched = field[1].touched === false;
      const hasValue = field[0].value !== null && field[0].value !== '';
      if (noError) {
        if (hasValue) return true;
        if (hasNotBeenTouched) return false;
      }
      return false;
    });
    if (isFormValid) return true;
    return false;
  }, [screenFields, form]);

  const setErrorOnInvalidFields = useCallback(() => {
    screenFields.forEach(field => {
      const { name, value } = field[0];
      const noValue = value === null || value === '';
      if (noValue) {
        form.setFieldError(name, 'Invalid input');
        form.setFieldTouched(name, true, false);
      }
    });
  }, [screenFields, form]);

  const onPressNext = useCallback(() => {
    const isFormValid = validateForm();
    if (isFormValid) {
      navigation.navigate(
        Routes.HomeStack.RegisterPatientStack.PatientSpecificInfo,
      );
    } else {
      setErrorOnInvalidFields();
    }
  }, [form]);

  return (
    <FullView background={theme.colors.BACKGROUND_GREY}>
      <StatusBar barStyle="light-content" />
      <Header onGoBack={onGoBack} />
      <PatientPersonalInfoForm onPressNext={onPressNext} />
    </FullView>
  );
};
