import React from 'react';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { Routes } from '~/ui/helpers/routes';
import { SelectProgramRegistryForm } from '../screens/patientProgramRegistry/form/SelectProgramRegistryForm';
import { PatientProgramRegistryDetailsForm } from '../screens/patientProgramRegistry/form/PatientProgramRegistryDetailsForm';
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
  facilityId: string;
  clinicianId: string;
  conditions: string[];
}
export interface PatientProgramRegistryProps extends BaseAppProps {
  navigation: NavigationProp<any>;
  editedObject?: IPatientProgramRegistryForm;
}

const PatientProgramRegistryForm = ({ selectedPatient }: PatientProgramRegistryProps) => {
  return (
    <ErrorBoundary>
      <Stack.Navigator headerMode="none">
        <Stack.Screen
          name={Routes.HomeStack.PatientProgramRegistryFormStack.Index}
          component={SelectProgramRegistryForm}
          initialParams={{ selectedPatient }}
        />
        <Stack.Screen
          name={Routes.HomeStack.PatientProgramRegistryFormStack.PatientProgramRegistryForm}
          component={PatientProgramRegistryDetailsForm}
          initialParams={{ selectedPatient }}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
};
export const PatientProgramRegistryFormStack = compose(withPatient)(PatientProgramRegistryForm);
