import React from 'react';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { FullView } from '~/ui/styled/common';
import { Routes } from '~/ui/helpers/routes';
import { createStackNavigator } from '@react-navigation/stack';
import { PatientProgramRegistryDetails } from '../screens/patientProgramRegistry/PatientProgramRegistryDetails';
import { PatientProgramRegistryRegistrationStatus } from '../screens/patientProgramRegistry/PatientProgramRegistryRegistrationStatus';
import { useBackendEffect } from '~/ui/hooks/index';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';

const Stack = createStackNavigator();
export const PatientProgramRegistryDetailsStack = ({ navigation, route }: BaseAppProps) => {
  const { patientProgramRegistration } = route.params;
  const [registration, registrationError, isRegistrationLoading] = useBackendEffect(
    async ({ models }) =>
      await models.PatientProgramRegistration.getFullPprbyId(patientProgramRegistration.id),
    [patientProgramRegistration.id],
  );

  if (isRegistrationLoading) return <LoadingScreen />;
  if (registrationError) return <ErrorScreen error={registrationError} />;
  return (
    <ErrorBoundary>
      <FullView>
        <EmptyStackHeader
          title={registration?.programRegistry?.name}
          onGoBack={() => navigation.navigate(Routes.HomeStack.PatientSummaryStack.Index)}
          status={
            <PatientProgramRegistryRegistrationStatus
              registrationStatus={registration.registrationStatus?.name}
            />
          }
        />
        <Stack.Navigator headerMode="none" initialRouteName="PatientProgramRegistryDetails">
          <Stack.Screen
            name={Routes.HomeStack.PatientProgramRegistryDetailsStack.Index}
            component={PatientProgramRegistryDetails}
            initialParams={{ patientProgramRegistration: registration }}
          />
        </Stack.Navigator>
      </FullView>
    </ErrorBoundary>
  );
};
