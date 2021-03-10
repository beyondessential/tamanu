import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProgramListScreen } from '../screens/programs/ProgramListScreen';
import { SurveyResponseDetailsScreen } from '../screens/programs/SurveyResponseDetailsScreen';
import { Routes } from '/helpers/routes';
import { NewProgramEntryTabs } from './NewProgramEntryTabs';
import { ReferralFormListScreen } from '../screens/referrals/ReferralFormListScreen';
import { SurveyResponseScreen } from '../screens/programs/tabs/SurveyResponseScreen';

const Stack = createStackNavigator();

export const ReferralFormStack = ({ route }): ReactElement => {
  const { surveyId, selectedPatient } = route.params;
  
  return (
  <Stack.Navigator headerMode="none">
    <Stack.Screen
      name={Routes.HomeStack.ProgramStack.ReferralTabs.Index}
      component={ReferralFormListScreen}
    />
    <Stack.Screen
      name={Routes.HomeStack.ProgramStack.ReferralTabs.AddReferralDetails}
      initialParams={{
        surveyId,
        selectedPatient,
      }}
      options={{
        title: 'Add Details',
      }}
      component={SurveyResponseScreen}
    />
  </Stack.Navigator>
)};
