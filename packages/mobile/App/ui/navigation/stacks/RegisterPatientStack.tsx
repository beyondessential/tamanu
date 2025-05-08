import React, { ReactElement } from 'react';

import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { NewPatientScreen } from '../screens/registerPatient/NewPatientScreen';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { EditPatientScreen } from '../screens/home/PatientDetails/PatientDetails';

const Stack = createStackNavigator();

export const RegisterPatientStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator headerMode="none">
      <Stack.Screen
        name={Routes.HomeStack.RegisterPatientStack.PatientPersonalInfo}
        component={EditPatientScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.RegisterPatientStack.NewPatient}
        component={NewPatientScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
