import React from 'react';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { Routes } from '~/ui/helpers/routes';
import { PatientProgramRegistryForm1 } from '../screens/patientProgramRegistry/PatientProgramRegistryForm1';
import { PatientProgramRegistryForm2 } from '../screens/patientProgramRegistry/PatientProgramRegistryForm2';
import { NavigationProp } from '@react-navigation/native';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { createStackNavigator } from '@react-navigation/stack';
import { ConditionMultiselect } from '../screens/patientProgramRegistry/ConditionMultiselect';

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
          component={PatientProgramRegistryForm1}
          initialParams={{ selectedPatient }}
        />
        <Stack.Screen
          name={Routes.HomeStack.PatientProgramRegistryFormStack.PatientProgramRegistryForm}
          component={PatientProgramRegistryForm2}
          initialParams={{ selectedPatient }}
        />
        <Stack.Screen
          name={Routes.HomeStack.PatientProgramRegistryFormStack.ConditionMultiselect}
          component={ConditionMultiselect}
          initialParams={{ selectedPatient }}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
};
export const PatientProgramRegistryFormStack = compose(withPatient)(PatientProgramRegistryForm);
