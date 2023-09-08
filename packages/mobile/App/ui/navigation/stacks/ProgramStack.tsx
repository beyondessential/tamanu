import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SurveyResponseDetailsScreen } from '../screens/programs/SurveyResponseDetailsScreen';
import { Routes } from '/helpers/routes';
import { ProgramTabs } from './ProgramTabs';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { SurveyListScreen } from '../screens/programs/SurveyListScreen';
import { SurveyResponseScreen } from '../screens/programs/tabs/SurveyResponseScreen';

const Stack = createStackNavigator();

export const ProgramStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator headerMode="none">
      <Stack.Screen
        name={Routes.HomeStack.ProgramStack.ProgramTabs.Index}
        component={ProgramTabs}
      />
      <Stack.Screen
        name={Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.Index}
        component={SurveyListScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.AddDetails}
        component={SurveyResponseScreen}
      />
      <Stack.Screen
        name={Routes.HomeStack.ProgramStack.SurveyResponseDetailsScreen}
        component={SurveyResponseDetailsScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
