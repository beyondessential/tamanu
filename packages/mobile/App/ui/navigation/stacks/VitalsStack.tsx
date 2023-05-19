import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { VitalsTabs } from './VitalsTabs';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const VitalsStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator headerMode="none">
      <Stack.Screen name={Routes.HomeStack.VitalsStack.Index} component={VitalsTabs} />
    </Stack.Navigator>
  </ErrorBoundary>
);
