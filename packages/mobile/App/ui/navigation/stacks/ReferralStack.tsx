import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ReferralTabs } from './ReferralTabs';
import { SurveyResponseDetailsScreen } from '../screens/programs/SurveyResponseDetailsScreen';
import { Routes } from '/helpers/routes';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const ReferralStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator headerMode="none">
      <Stack.Screen
        name={Routes.HomeStack.ReferralStack.Index}
        component={ReferralTabs}
      />
      <Stack.Screen
        name={
          Routes.HomeStack.ReferralStack.ViewHistory.SurveyResponseDetailsScreen
        }
        component={SurveyResponseDetailsScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
