import React, { ReactElement } from 'react';

import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { PatientPersonalInfoScreen } from '../screens/registerPatient/PatientPersonalInfoScreen';
import { NewPatientScreen } from '../screens/registerPatient/NewPatientScreen';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const RegisterPatientStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator headerMode="none">
      <Stack.Screen
        name={Routes.HomeStack.RegisterPatientStack.PatientPersonalInfo}
        component={PatientPersonalInfoScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.RegisterPatientStack.NewPatient}
        component={NewPatientScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
