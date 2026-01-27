import React, { ReactElement } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ReferralScreen } from './ReferralScreen';
import { SurveyResponseDetailsScreen } from '../screens/programs/SurveyResponseDetailsScreen';
import { Routes } from '/helpers/routes';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { SurveyResponseScreen } from '../screens/programs/SurveyResponseScreen';
import { SurveyTypes } from '~/types';
import { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { PatientStateProps } from '~/ui/store/ducks/patient';
import { useSelector } from 'react-redux';

const Stack = createStackNavigator();

export const ReferralStack = (): ReactElement => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  return (
    <ErrorBoundary>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={Routes.HomeStack.ReferralStack.Index} component={ReferralScreen} />
        <Stack.Screen
          name={Routes.HomeStack.ReferralStack.ViewHistory.SurveyResponseDetailsScreen}
          component={SurveyResponseDetailsScreen}
        />
        <Stack.Screen
          name={Routes.HomeStack.ReferralStack.ReferralList.AddReferralDetails}
          initialParams={{
            selectedPatient,
            surveyType: SurveyTypes.Referral,
          }}
          component={SurveyResponseScreen}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
};
