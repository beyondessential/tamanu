import { Routes } from '/helpers/routes';
import { createStackNavigator } from '@react-navigation/stack';
import React, { ReactElement } from 'react';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { LabRequestTabs } from './LabRequestTabs';

const Stack = createStackNavigator();

export const LabRequestStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator headerMode="none">
      <Stack.Screen
        name={Routes.HomeStack.LabRequestStack.Index}
        component={LabRequestTabs}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
