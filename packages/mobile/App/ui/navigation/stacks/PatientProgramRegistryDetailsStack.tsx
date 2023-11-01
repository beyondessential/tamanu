import React from 'react';
import { compose } from 'redux';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { withPatient } from '~/ui/containers/Patient';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { FullView, RowView, StyledView } from '~/ui/styled/common';
import { Routes } from '~/ui/helpers/routes';
import { createStackNavigator } from '@react-navigation/stack';
import { PatientProgramRegistryDetails } from '../screens/patientProgramRegistry/PatientProgramRegistryDetails';
import { PatientProgramRegistryRegistrationStatus } from '../screens/patientProgramRegistry/PatientProgramRegistryRegistrationStatus';

const Stack = createStackNavigator();
const PatientProgramRegistryDetails_ = ({ navigation, selectedPatient, route }: BaseAppProps) => {
  const { patientProgramRegistry } = route.params;

  return (
    <ErrorBoundary>
      <FullView>
        <EmptyStackHeader
          title={patientProgramRegistry.programRegistry.name}
          onGoBack={() => navigation.goBack()}
          status={
            <PatientProgramRegistryRegistrationStatus
              registrationStatus={patientProgramRegistry.registrationStatus}
            />
          }
        />
        <Stack.Navigator headerMode="none" initialRouteName="PatientProgramRegistryDetails">
          <Stack.Screen
            name={Routes.HomeStack.PatientProgramRegistryDetailsStack.Index}
            component={PatientProgramRegistryDetails}
            initialParams={{ patientProgramRegistry }}
          />
        </Stack.Navigator>
      </FullView>
    </ErrorBoundary>
  );
};

export const PatientProgramRegistryDetailsStack = compose(withPatient)(
  PatientProgramRegistryDetails_,
);
