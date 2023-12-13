import React, { ReactElement } from 'react';

import { Routes } from '/helpers/routes';
import { createStackNavigator } from '@react-navigation/stack';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { NewPatientScreen } from '../screens/registerPatient/NewPatientScreen';
import { PatientPersonalInfoScreen } from '../screens/registerPatient/PatientPersonalInfoScreen';

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
