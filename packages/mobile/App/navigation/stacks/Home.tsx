import React, { ReactElement } from 'react';
// Navigators
import { createStackNavigator } from '@react-navigation/stack';
// Components
import { WelcomeIntroTabs } from './WelcomeIntro';
import { HomeTabs } from './HomeTabs';
// Stacks
import { SearchPatientStack } from './SearchPatient';
// Helpers
import { Routes } from '../../helpers/constants';
import { noSwipeGestureOnNavigator } from '../../helpers/navigators';


const Stack = createStackNavigator();

export const HomeStack = (): ReactElement => (
  <Stack.Navigator
    headerMode="none"
    screenOptions={noSwipeGestureOnNavigator}
  >
    <Stack.Screen
      name="welcome"
      component={WelcomeIntroTabs}
    />
    <Stack.Screen
      name={Routes.HomeStack.Home}
      component={HomeTabs}
    />
    <Stack.Screen
      name={Routes.HomeStack.SearchPatientStack.name}
      component={SearchPatientStack}
    />
  </Stack.Navigator>
);
