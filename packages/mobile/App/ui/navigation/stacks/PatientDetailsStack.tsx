import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '~/ui/helpers/routes';
import { PatientDetailsScreen } from '~/ui/navigation/screens/home/PatientDetails/Screen';
import { AddPatientIssueScreen } from '~/ui/navigation/screens/home/PatientDetails/AddPatientIssue';
import { EditPatientScreen } from '~/ui/navigation/screens/home/PatientDetails/EditPatient';
import { EditPatientAdditionalDataScreen } from '~/ui/navigation/screens/home/PatientDetails/EditPatientAdditionalData';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { CambodiaEditPatientScreen } from '../screens/home/PatientDetails/layouts/cambodia/CambodiaEditGeneralInfo';

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

      {/* Generic patient details components */}
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Generic.EditPatient}
        component={EditPatientScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Generic.EditPatientAdditionalData}
        component={EditPatientAdditionalDataScreen}
      />

      {/* Cambodia specific patient details components */}
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Cambodia.EditPatient}
        component={CambodiaEditPatientScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Cambodia.EditPatientAdditionalData}
        component={EditPatientAdditionalDataScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
