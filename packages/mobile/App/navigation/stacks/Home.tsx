import React, { ReactElement } from 'react';
// Navigators
import { createStackNavigator } from '@react-navigation/stack';
import { VaccineStack } from './VaccineStack';
// Components
import { WelcomeIntroTabs } from './WelcomeIntro';
import { PatientDetailsScreen } from '../screens/home/PatientDetails';
import { HomeTabsStack } from './HomeTabs';
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
      name={Routes.HomeStack.WelcomeIntroStack}
      component={WelcomeIntroTabs}
    />
    <Stack.Screen
      name={Routes.HomeStack.VaccineStack.name}
      component={VaccineStack}
    />
    <Stack.Screen
      name={Routes.HomeStack.HomeTabs.name}
      component={HomeTabsStack}
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
