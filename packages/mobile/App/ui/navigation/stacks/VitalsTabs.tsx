import React, { type ReactElement } from 'react';
import { compose } from 'redux';
import type { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { AddVitalsScreen, ViewHistoryScreen } from '../screens/vitals/tabs';
import { withPatient } from '~/ui/containers/Patient';
import type { IPatient } from '~/types';
import { joinNames } from '~/ui/helpers/user';
import { TranslatedText } from '/components/Translations/TranslatedText';

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
};

const getPatientName = (patient: IPatient): string => joinNames(patient);

const DumbVitalsTabs = ({
  navigation,
  selectedPatient,
}: NewProgramEntryTabsProps): ReactElement => {
  return (
    <>
      <StackHeader
        title={<TranslatedText stringId="patient.vitals.title" fallback="Vitals" />}
        subtitle={getPatientName(selectedPatient)}
        onGoBack={navigation.goBack}
      />
      <TopTabNavigator screenOptions={{ lazy: true }}>
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText stringId="patient.vitals.heading.addVitals" fallback="Add Vitals" />
            ),
          }}
          name={Routes.HomeStack.VitalsStack.VitalsTabs.AddDetails}
          component={AddVitalsScreen}
        />
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText stringId="patient.vitals.heading.history" fallback="History" />
            ),
          }}
          name={Routes.HomeStack.VitalsStack.VitalsTabs.ViewHistory}
          component={ViewHistoryScreen}
        />
      </TopTabNavigator>
    </>
  );
};

export const VitalsTabs = compose(withPatient)(DumbVitalsTabs);
