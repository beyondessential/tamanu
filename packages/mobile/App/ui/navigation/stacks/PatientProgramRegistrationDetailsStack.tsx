import React from 'react';
import { subject } from '@casl/ability';

import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { FullView } from '~/ui/styled/common';
import { Routes } from '~/ui/helpers/routes';
import { createStackNavigator } from '@react-navigation/stack';
import { PatientProgramRegistrationDetails } from '../screens/patientProgramRegistration/PatientProgramRegistrationDetails';
import { PatientProgramRegistryRegistrationStatus } from '../screens/patientProgramRegistration/PatientProgramRegistryRegistrationStatus';
import { useBackendEffect } from '~/ui/hooks/index';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';
import { useAuth } from '~/ui/contexts/AuthContext';
import { PermissionErrorScreen } from '~/ui/components/PermissionErrorScreen';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';

const Stack = createStackNavigator();
export const PatientProgramRegistrationDetailsStack = ({ navigation, route }: BaseAppProps) => {
  const { patientProgramRegistration } = route.params;
  const { ability } = useAuth();

  const [registration, registrationError, isRegistrationLoading] = useBackendEffect(
    async ({ models }) =>
      await models.PatientProgramRegistration.getFullPprById(patientProgramRegistration.id),
    [patientProgramRegistration.id],
  );

  if (isRegistrationLoading) return <LoadingScreen />;
  if (registrationError) return <ErrorScreen error={registrationError} />;

  const canReadProgramRegistry = ability.can(
    'read', subject('ProgramRegistry', { id: registration.programRegistryId }),
  );
  if (!canReadProgramRegistry) {
    return <PermissionErrorScreen errorMessage="You do not have access to this program registry" />;
  }

  return (
    <ErrorBoundary>
      <FullView>
        <EmptyStackHeader
          title={
            <TranslatedReferenceData
              fallback={registration.programRegistry?.name}
              value={registration.programRegistry?.id}
              category="programRegistry"
            />
          }
          onGoBack={() => navigation.navigate(Routes.HomeStack.PatientSummaryStack.Index)}
          status={
            <PatientProgramRegistryRegistrationStatus
              registrationStatus={registration.registrationStatus}
            />
          }
        />
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="PatientProgramRegistrationDetails">
          <Stack.Screen
            name={Routes.HomeStack.PatientProgramRegistrationDetailsStack.Index}
            component={PatientProgramRegistrationDetails}
            initialParams={{ patientProgramRegistration: registration }}
          />
        </Stack.Navigator>
      </FullView>
    </ErrorBoundary>
  );
};
