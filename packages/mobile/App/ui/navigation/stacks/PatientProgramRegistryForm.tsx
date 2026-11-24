import React from 'react';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { Routes } from '~/ui/helpers/routes';
import { SelectProgramRegistryForm } from '../screens/patientProgramRegistration/form/SelectProgramRegistryForm';
import { PatientProgramRegistrationDetailsForm } from '../screens/patientProgramRegistration/form/PatientProgramRegistrationDetailsForm';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { createStackNavigator } from '@react-navigation/stack';

export const Stack = createStackNavigator();

export interface IPatientProgramRegistryForm {
  programRegistryId: string;
  clinicalStatusId: string;
  date: any;
  registeringFacilityId: string;
  clinicianId: string;
  conditions: any[];
}

export const PatientProgramRegistryFormStack = () => {
  const { selectedPatient } = useSelectedPatient();
  return (
    <ErrorBoundary>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={Routes.HomeStack.PatientProgramRegistryFormStack.Index}
          component={SelectProgramRegistryForm}
          initialParams={{ selectedPatient }}
        />
        <Stack.Screen
          name={Routes.HomeStack.PatientProgramRegistryFormStack.PatientProgramRegistryForm}
          component={PatientProgramRegistrationDetailsForm}
          initialParams={{ selectedPatient }}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
};
