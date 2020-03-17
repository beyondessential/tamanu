import React, { ReactElement } from 'react';
// Navigators
import { createStackNavigator } from '@react-navigation/stack';
// Components
import { WelcomeIntroTabs } from './WelcomeIntro';
import { HomeTabStack } from './HomeTabs';
// Stacks
import { SearchPatientStack } from './SearchPatient';
// Helpers
import { Routes } from '../../helpers/constants';
import { noSwipeGestureOnNavigator } from '../../helpers/navigators';
import { PatientDetailsScreen } from '../screens/home/PatientDetails';


const Stack = createStackNavigator();

export const HomeStack = (): ReactElement => (
  <Stack.Navigator
    headerMode="none"
    screenOptions={noSwipeGestureOnNavigator}
  >
    <Stack.Screen
      name={Routes.HomeStack.WelcomeIntroStack}
      component={WelcomeIntroTabs}
    />
    <Stack.Screen
      name={Routes.HomeStack.HomeTabs.name}
      component={HomeTabStack}
    />
    <Stack.Screen
      name={Routes.HomeStack.PatientDetails}
      component={PatientDetailsScreen}
    />
    <Stack.Screen
      name={Routes.HomeStack.SearchPatientStack.name}
      component={SearchPatientStack}
    />
  </Stack.Navigator>
);
