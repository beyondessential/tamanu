import { createStackNavigator } from '@react-navigation/stack';
import React, { ReactElement } from 'react';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { Routes } from '~/ui/helpers/routes';
import { AddPatientIssueScreen } from '~/ui/navigation/screens/home/PatientDetails/AddPatientIssue';
import { EditPatientScreen } from '~/ui/navigation/screens/home/PatientDetails/EditPatient';
import { EditPatientAdditionalDataScreen } from '~/ui/navigation/screens/home/PatientDetails/EditPatientAdditionalData';
import { PatientDetailsScreen } from '~/ui/navigation/screens/home/PatientDetails/Screen';

const Stack = createStackNavigator();

export const PatientDetailsStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator headerMode="none">
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Index}
        component={PatientDetailsScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.AddPatientIssue}
        component={AddPatientIssueScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.EditPatient}
        component={EditPatientScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.EditPatientAdditionalData}
        component={EditPatientAdditionalDataScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
