import React, { ReactElement, useCallback } from 'react';
import { NavigationProp, useIsFocused } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { compose } from 'redux';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { joinNames } from '/helpers/user';
import { AddRefferalDetailScreen } from '../screens/referrals/AddReferralDetailScreen';
import { PatientHistoryAccordion } from '~/ui/components/PatientHistoryAccordion';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '~/ui/components/ErrorScreen';

const Tabs = createTopTabNavigator();

type ReferralTabsProps = {
  navigation: NavigationProp<any>;
} & BaseAppProps;

const refferalHistoryRows = {
  date: {
    name: 'Date',
    accessor: (date): string => date.toDateString(),
  },
  diagnosis: {
    name: 'Diagnosis',
    accessor: (diagnosis): string => diagnosis.name,
  },
  certainty: {
    name: 'Certainty',
  },
  department: {
    name: 'Department',
  },
  facility: {
    name: 'Facility',
  },
  notes: {
    name: 'Notes',
  },
};

const DumbReferralHistoryScreen = ({ selectedPatient }): JSX.Element => {
  const isFocused = useIsFocused();
  const [data, error] = useBackendEffect(
    ({ models }) => models.Referral.getForPatient(selectedPatient.id),
    [isFocused],
  );

  if (error) return <ErrorScreen error={error} />;

  return (data
    ? <PatientHistoryAccordion rows={refferalHistoryRows} dataArray={data} />
    : <LoadingScreen />);
};

const ReferralHistoryScreen = compose(withPatient)(DumbReferralHistoryScreen);

const TabNavigator = ({
  navigation,
  selectedPatient,
}: ReferralTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <>
      <StackHeader
        title="Referrals"
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      <Tabs.Navigator swipeEnabled={false}>
        <Tabs.Screen
          options={{
            title: 'REFER PATIENT',
          }}
          name={Routes.HomeStack.ReferralTabs.AddReferralDetails}
          component={AddRefferalDetailScreen}
        />
        <Tabs.Screen
          options={{
            title: 'VIEW REFERRALS',
          }}
          name={Routes.HomeStack.ReferralTabs.ViewHistory}
          component={ReferralHistoryScreen}
        />
      </Tabs.Navigator>
    </>
  );
};

export const ReferralTabs = compose(withPatient)(TabNavigator);
