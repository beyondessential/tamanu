import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProgramListScreen } from '/navigation/screens/programs/ProgramListScreen';
import { Routes } from '/helpers/routes';
import { NewProgramEntryTabs } from './NewProgramEntryTabs';
import { CheckUpTabs } from './CheckUpTabs';

const Stack = createStackNavigator();

export const CheckUpStack = (): ReactElement => (
  <Stack.Navigator headerMode="none">
    <Stack.Screen
      name={Routes.HomeStack.CheckUpStack.name}
      component={CheckUpTabs}
    />
  </Stack.Navigator>
);
