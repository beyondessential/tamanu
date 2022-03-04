import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { AddDeceasedDetailsScreen } from '../screens/deceased/AddDeceasedDetails';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const DeceasedStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator headerMode="none">
      <Stack.Screen
        name={Routes.HomeStack.DeceasedStack.AddDeceasedDetails}
        component={AddDeceasedDetailsScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
