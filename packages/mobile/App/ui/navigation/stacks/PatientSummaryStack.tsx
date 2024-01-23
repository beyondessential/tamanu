import React, { ReactElement, useCallback } from 'react';
import { Routes } from '/helpers/routes';
import { ErrorBoundary } from '/components/ErrorBoundary';
import { StackHeader } from '~/ui/components/StackHeader';
import { joinNames } from '~/ui/helpers/user';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';
import { NavigationProp } from '@react-navigation/native';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { createStackNavigator } from '@react-navigation/stack';
import { PatientProgramRegistrySummary } from '../screens/patientProgramRegistry/PatientProgramRegistrySummary';

const Stack = createStackNavigator();
interface PatientSummaryStackProps extends BaseAppProps {
  navigation: NavigationProp<any>;
}

const PatientSummary = ({
  navigation,
  selectedPatient,
}: PatientSummaryStackProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <ErrorBoundary>
      <StackHeader
        title="Patient Summary"
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      <Stack.Navigator headerMode="none">
        <Stack.Screen
          name={Routes.HomeStack.PatientSummaryStack.Index}
          component={PatientProgramRegistrySummary}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
};

export const PatientSummaryStack = compose(withPatient)(PatientSummary);
