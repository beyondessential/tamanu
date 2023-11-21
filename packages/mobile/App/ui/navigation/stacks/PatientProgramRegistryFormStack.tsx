import React from 'react';
import { NavigationProp } from '@react-navigation/native';
import { compose } from 'redux';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { EmptyStackHeader } from '~/ui/components/StackHeader';
import { withPatient } from '~/ui/containers/Patient';
import { BaseAppProps } from '~/ui/interfaces/BaseAppProps';
import { FullView } from '~/ui/styled/common';
import { Routes } from '~/ui/helpers/routes';
import { PatientProgramRegistryForm } from '../screens/patientProgramRegistry/PatientProgramRegistryForm';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();
interface PatientProgramRegistryProps extends BaseAppProps {
  navigation: NavigationProp<any>;
}

const PatientProgramRegistryForm_ = ({ navigation }: PatientProgramRegistryProps) => {
  return (
    <ErrorBoundary>
      <FullView>
        <EmptyStackHeader title="Program registry" onGoBack={() => navigation.goBack()} />
        <Stack.Navigator headerMode="none">
          <Stack.Screen
            name={Routes.HomeStack.PatientProgramRegistryFormStack.Index}
            component={PatientProgramRegistryForm}
          />
        </Stack.Navigator>
      </FullView>
    </ErrorBoundary>
  );
};

export const PatientProgramRegistryFormStack = compose(withPatient)(PatientProgramRegistryForm_);
