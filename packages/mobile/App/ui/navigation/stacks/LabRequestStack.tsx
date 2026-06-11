import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { LabRequestTabs } from './LabRequestTabs';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const LabRequestStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={Routes.HomeStack.LabRequestStack.Index}
        component={LabRequestTabs}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
