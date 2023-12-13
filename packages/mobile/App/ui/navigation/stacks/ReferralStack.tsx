import { Routes } from '/helpers/routes';
import { createStackNavigator } from '@react-navigation/stack';
import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { SurveyTypes } from '~/types';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { PatientStateProps } from '~/ui/store/ducks/patient';
import { SurveyResponseDetailsScreen } from '../screens/programs/SurveyResponseDetailsScreen';
import { SurveyResponseScreen } from '../screens/programs/SurveyResponseScreen';
import { ReferralScreen } from './ReferralScreen';

const Stack = createStackNavigator();

export const ReferralStack = (): ReactElement => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );

  return (
    <ErrorBoundary>
      <Stack.Navigator headerMode="none">
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
