import { Routes } from '/helpers/routes';
import { createStackNavigator } from '@react-navigation/stack';
import React, { ReactElement } from 'react';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { VitalsTabs } from './VitalsTabs';

const Stack = createStackNavigator();

export const VitalsStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator headerMode="none">
      <Stack.Screen name={Routes.HomeStack.VitalsStack.Index} component={VitalsTabs} />
    </Stack.Navigator>
  </ErrorBoundary>
);
