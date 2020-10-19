import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { CheckUpTabs } from './CheckUpTabs';

const Stack = createStackNavigator();

export const CheckUpStack = (): ReactElement => (
  <Stack.Navigator headerMode="none">
    <Stack.Screen
      name={Routes.HomeStack.CheckUpStack.Index}
      component={CheckUpTabs}
    />
  </Stack.Navigator>
);
