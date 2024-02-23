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
import { PatientProgramRegistrySummary } from '../screens/patientProgramRegistration/PatientProgramRegistrySummary';

const Stack = createStackNavigator();

// N.B. this component is called `PatientSummaryStack` despite only covering program registries,
// as it is intended to be a container for other patient summary details in the future.
// See discussion at on Figma
// https://www.figma.com/file/6HQUhPFlEVM2gLjiLH8cu0?node-id=8701:15098&mode=design#712035286
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
        title="Program registries"
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
