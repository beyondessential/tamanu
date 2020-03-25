import React, { ReactElement } from 'react';
// Navigators
import { createStackNavigator } from '@react-navigation/stack';
// Components
import { WelcomeIntroTabs } from './WelcomeIntro';
import { HomeTabsStack } from './HomeTabs';
import { PatientDetailsScreen } from '../screens/home/PatientDetails';
// Stacks
import { SearchPatientStack } from './SearchPatient';
import { VaccineStack } from './VaccineStack';
// Helpers
import { noSwipeGestureOnNavigator } from '/helpers/navigators';
import { Routes } from '/helpers/routes';
import { ProgramStack } from './ProgramStack';

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
      name={Routes.HomeStack.ProgramStack.name}
      component={ProgramStack}
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
