import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// Helpers
import { Routes } from '../../helpers/constants';
import { noSwipeGestureOnNavigator } from '../../helpers/navigators';
// Navigator
import { SearchPatientTabs } from './SearchPatientTabs';

const Stack = createStackNavigator();

export const SearchPatientStack = (): ReactElement => (
  <Stack.Navigator
    headerMode="none"
    screenOptions={noSwipeGestureOnNavigator}
  >
    <Stack.Screen
      name={Routes.HomeStack.SearchPatientStack.SearchPatientTabs.name}
      component={SearchPatientTabs}
    />
  </Stack.Navigator>
);
