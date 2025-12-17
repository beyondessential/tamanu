import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { VitalsTabs } from './VitalsTabs';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const VitalsStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VitalsTabs" component={VitalsTabs} />
    </Stack.Navigator>
  </ErrorBoundary>
);
