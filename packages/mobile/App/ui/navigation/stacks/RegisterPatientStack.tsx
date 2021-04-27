import React, { ReactElement, useCallback } from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { PatientPersonalInfoScreen } from '../screens/registerPatient/PatientPersonalInfoScreen';
import PatientSpecificInfoScreen from '../screens/registerPatient/PatientSpecificInfoScreen';
import { NewPatientScreen } from '../screens/registerPatient/NewPatientScreen';
import { newPatientFormValues } from '/helpers/form';
import { RegisterPatientStackProps } from '/interfaces/screens/RegisterPatientStack/RegisterPatientStackProps';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const RegisterPatientStack = ({
  navigation,
}: RegisterPatientStackProps): ReactElement => {
  const onSubmitForm = useCallback(() => {
    navigation.navigate(Routes.HomeStack.RegisterPatientStack.NewPatient);
  }, []);

  return (
    <ErrorBoundary>
      <Formik
        initialValues={newPatientFormValues}
        validationSchema={Yup.object().shape({
          firstName: Yup.string().required(),
          lastName: Yup.string().required(),
          gender: Yup.string().required(),
          middleName: Yup.string(),
          email: Yup.string(),
          phone: Yup.string(),
          province: Yup.string(),
          city: Yup.string(),
          address: Yup.string(),
          bloodType: Yup.string(),
          maritalStatus: Yup.string(),
          licenseNumber: Yup.string(),
        })}
        onSubmit={onSubmitForm}
      >
        <Stack.Navigator headerMode="none">
          <Stack.Screen
            name={Routes.HomeStack.RegisterPatientStack.PatientPersonalInfo}
            component={PatientPersonalInfoScreen}
          />
          <Stack.Screen
            name={Routes.HomeStack.RegisterPatientStack.PatientSpecificInfo}
            component={PatientSpecificInfoScreen}
          />
          <Stack.Screen
            name={Routes.HomeStack.RegisterPatientStack.NewPatient}
            component={NewPatientScreen}
          />
        </Stack.Navigator>
      </Formik>
    </ErrorBoundary>
  );
};
