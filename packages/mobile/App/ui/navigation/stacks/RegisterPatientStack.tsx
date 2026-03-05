import React, { ReactElement } from 'react';

import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { NewPatientScreen } from '../screens/registerPatient/NewPatientScreen';
import { EditPatientScreen } from '../screens/home/PatientDetails/EditGeneralInfo';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const RegisterPatientStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={Routes.HomeStack.RegisterPatientStack.PatientPersonalInfo}
        component={EditPatientScreen}
        initialParams={{
          isEdit: false,
        }}
      />
      <Stack.Screen
        name={Routes.HomeStack.RegisterPatientStack.NewPatient}
        component={NewPatientScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
