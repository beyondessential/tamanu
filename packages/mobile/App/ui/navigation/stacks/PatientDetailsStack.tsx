import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '~/ui/helpers/routes';
import { PatientDetailsScreen } from '~/ui/navigation/screens/home/PatientDetails/Screen';
import { AddPatientIssueScreen } from '~/ui/navigation/screens/home/PatientDetails/AddPatientIssue';
import { EditPatientScreen as GenericEditPatientScreen } from '../screens/home/PatientDetails/layouts/generic/EditGeneralInfo';
import { EditPatientAdditionalDataScreen as GenericEditPatientAdditionalDataScreen } from '../screens/home/PatientDetails/layouts/generic/EditAdditionalInfo';
import { EditPatientScreen as CambodiaEditPatientScreen } from '../screens/home/PatientDetails/layouts/cambodia/EditGeneralInfo';
import { EditPatientAdditionalDataScreen as CambodiaEditPatientAdditionalDataScreen } from '../screens/home/PatientDetails/layouts/cambodia/EditAdditionalInfo';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

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
        component={GenericEditPatientScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Generic.EditPatientAdditionalData}
        component={GenericEditPatientAdditionalDataScreen}
      />

      {/* Cambodia specific patient details components */}
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Cambodia.EditPatient}
        component={CambodiaEditPatientScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.PatientDetailsStack.Cambodia.EditPatientAdditionalData}
        component={CambodiaEditPatientAdditionalDataScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
