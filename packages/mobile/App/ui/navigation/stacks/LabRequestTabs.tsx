import React, { type ReactElement } from 'react';
import { compose } from 'redux';
import type { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { AddLabRequestScreen, ViewHistoryScreen } from '../screens/labRequests/tabs';
import { withPatient } from '~/ui/containers/Patient';
import type { IPatient } from '~/types';
import { joinNames } from '~/ui/helpers/user';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
};

const getPatientName = (patient: IPatient): string => joinNames(patient);

const DumbLabRequestTabs = ({
  navigation,
  selectedPatient,
}: NewProgramEntryTabsProps): ReactElement => {
  return (
    <>
      <StackHeader
        title={<TranslatedText stringId="patient.test.title" fallback="New Test - Lab request" />}
        subtitle={getPatientName(selectedPatient)}
        onGoBack={navigation.goBack}
      />
      <TopTabNavigator screenOptions={{ lazy: true }}>
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText stringId="patient.test.newTest.title" fallback="New test" />
            ),
          }}
          name={Routes.HomeStack.LabRequestStack.LabRequestTabs.NewRequest}
          component={AddLabRequestScreen}
        />
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText
                stringId="patient.test.requestHistory.title"
                fallback="Request history"
              />
            ),
          }}
          name={Routes.HomeStack.LabRequestStack.LabRequestTabs.ViewHistory}
          component={ViewHistoryScreen}
        />
      </TopTabNavigator>
    </>
  );
};

export const LabRequestTabs = compose(withPatient)(DumbLabRequestTabs);
