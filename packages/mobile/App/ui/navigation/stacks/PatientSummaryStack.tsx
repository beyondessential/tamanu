import React, { ReactElement, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { FullView } from '/styled/common';
import { compose } from 'redux';
import { ErrorBoundary } from '/components/ErrorBoundary';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { withPatient } from '~/ui/containers/Patient';
import { StackHeader } from '~/ui/components/StackHeader';
import { joinNames } from '~/ui/helpers/user';
import { PatientProgrmRegistrySection } from './PatientProgrmRegistrySection';

const Stack = createStackNavigator();

interface PatientSummaryStackProps extends BaseAppProps {
  navigation: NavigationProp<any>;
}

const TabNavigator = ({ navigation, selectedPatient }: PatientSummaryStackProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <ErrorBoundary>
      <FullView>
        <StackHeader
          title="Patient Summary"
          subtitle={joinNames(selectedPatient)}
          onGoBack={goBack}
        />
        <Stack.Navigator headerMode="none">
          <Stack.Screen
            name={Routes.HomeStack.PatientSummaryStack.Index}
            component={PatientProgrmRegistrySection}
          />
        </Stack.Navigator>
      </FullView>
    </ErrorBoundary>
  );
};

export const PatientSummaryStack = compose(withPatient)(TabNavigator);
