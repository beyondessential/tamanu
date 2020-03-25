import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProgramListScreen } from '/navigation/screens/programs/ProgramListScreen';
import { Routes } from '/helpers/routes';
import { NewProgramEntryTabs } from './NewProgramEntryTabs';

const Stack = createStackNavigator();

export const ProgramStack = (): ReactElement => (
  <Stack.Navigator
    headerMode="none"
  >
    <Stack.Screen
      name={Routes.HomeStack.ProgramStack.ProgramListScreen}
      component={ProgramListScreen}
    />
    <Stack.Screen
      name={Routes.HomeStack.ProgramStack.ProgramTabs.name}
      component={NewProgramEntryTabs}
    />
  </Stack.Navigator>
);
