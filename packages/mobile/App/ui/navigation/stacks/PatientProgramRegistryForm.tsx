import React from 'react';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { Routes } from '~/ui/helpers/routes';
import { SelectProgramRegistryForm } from '../screens/patientProgramRegistration/form/SelectProgramRegistryForm';
import { PatientProgramRegistrationDetailsForm } from '../screens/patientProgramRegistration/form/PatientProgramRegistrationDetailsForm';
import { NavigationProp } from '@react-navigation/native';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
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
export interface PatientProgramRegistryProps extends BaseAppProps {
  navigation: NavigationProp<any>;
  editedObject?: IPatientProgramRegistryForm;
}

const PatientProgramRegistryForm = ({ selectedPatient }: PatientProgramRegistryProps) => {
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
export const PatientProgramRegistryFormStack = compose(withPatient)(PatientProgramRegistryForm);
