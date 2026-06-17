import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ReferralScreen } from './ReferralScreen';
import { SurveyResponseDetailsScreen } from '../screens/programs/SurveyResponseDetailsScreen';
import { Routes } from '/helpers/routes';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { SurveyResponseScreen } from '../screens/programs/SurveyResponseScreen';

const Stack = createStackNavigator();

export const ReferralStack = (): ReactElement => {
  return (
    <ErrorBoundary>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={Routes.HomeStack.ReferralStack.View} component={ReferralScreen} />
        <Stack.Screen
          name={Routes.HomeStack.ReferralStack.ViewHistory.SurveyResponseDetailsScreen}
          component={SurveyResponseDetailsScreen}
        />
        <Stack.Screen
          name={Routes.HomeStack.ReferralStack.ReferralList.AddReferralDetails}
          component={SurveyResponseScreen}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
};
