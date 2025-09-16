import React, { ReactElement, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { joinNames } from '/helpers/user';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { ReduxStoreProps } from '~/ui/interfaces/ReduxStoreProps';
import { PatientStateProps } from '~/ui/store/ducks/patient';
import { ReferralHistoryScreen } from '~/ui/navigation/screens/referrals/ReferralHistoryScreen';
import { ReferralFormListScreen } from '../screens/referrals/ReferralFormListScreen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

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
      <StackHeader
        title={<TranslatedText stringId="patient.referral.title" fallback="Referral" />}
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      <Tabs.Navigator swipeEnabled={false}>
        <Tabs.Screen
          initialParams={{
            selectedPatient,
          }}
          options={{
            title: () => (
              <TranslatedText
                stringId="patient.referral.heading.referPatient"
                fallback="Refer patient"
              />
            ),
          }}
          name={Routes.HomeStack.ReferralStack.ReferralList.Index}
          component={ReferralFormListScreen}
        />
        <Tabs.Screen
          options={{
            title: () => (
              <TranslatedText
                stringId="patient.referral.heading.viewReferral"
                fallback="View referrals"
              />
            ),
          }}
          name={Routes.HomeStack.ReferralStack.ViewHistory.Index}
          component={ReferralHistoryScreen}
        />
      </Tabs.Navigator>
    </ErrorBoundary>
  );
};
