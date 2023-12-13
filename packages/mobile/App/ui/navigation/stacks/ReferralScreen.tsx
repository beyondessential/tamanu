import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { Routes } from '/helpers/routes';
import { joinNames } from '/helpers/user';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import React, { ReactElement, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { ReferralHistoryScreen } from '~/ui/navigation/screens/referrals/ReferralHistoryScreen';
import { PatientStateProps } from '~/ui/store/ducks/patient';
import { ReferralFormListScreen } from '../screens/referrals/ReferralFormListScreen';

const Tabs = createTopTabNavigator();

export const ReferralScreen = ({ navigation }: BaseAppProps): ReactElement => {
  const { selectedPatient } = useSelector(
    (state: ReduxStoreProps): PatientStateProps => state.patient,
  );
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <ErrorBoundary>
      <StackHeader title="Referrals" subtitle={joinNames(selectedPatient)} onGoBack={goBack} />
      <Tabs.Navigator swipeEnabled={false}>
        <Tabs.Screen
          initialParams={{
            selectedPatient,
          }}
          options={{
            title: 'Refer patient',
          }}
          name={Routes.HomeStack.ReferralStack.ReferralList.Index}
          component={ReferralFormListScreen}
        />
        <Tabs.Screen
          options={{
            title: 'View referrals',
          }}
          name={Routes.HomeStack.ReferralStack.ViewHistory.Index}
          component={ReferralHistoryScreen}
        />
      </Tabs.Navigator>
    </ErrorBoundary>
  );
};
