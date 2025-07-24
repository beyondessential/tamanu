import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { AddLabRequestScreen, ViewHistoryScreen } from '../screens/labRequests/tabs';
import { withPatient } from '~/ui/containers/Patient';
import { IPatient } from '~/types';
import { joinNames } from '~/ui/helpers/user';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const Tabs = createTopTabNavigator();

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
};

const getPatientName = (patient: IPatient): string => joinNames(patient);

const DumbLabRequestTabs = ({
  navigation,
  selectedPatient,
}: NewProgramEntryTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <>
      <StackHeader
        title={<TranslatedText stringId="patient.test.title" fallback="New Test - Lab request" />}
        subtitle={getPatientName(selectedPatient)}
        onGoBack={goBack}
      />
      <Tabs.Navigator tabBarStyle={{}} contentStyle={{}} swipeEnabled={false} lazy>
        <Tabs.Screen
          options={{
            title: () => (
              <TranslatedText stringId="patient.test.newTest.title" fallback="New test" />
            ),
          }}
          name={Routes.HomeStack.LabRequestStack.LabRequestTabs.NewRequest}
          component={AddLabRequestScreen}
        />
        <Tabs.Screen
          options={{
            title: () => (
              <TranslatedText
                stringId="patient.test.requestHistory.title"
                fallback="Request history"
              />
            ),
          }}
          name={Routes.HomeStack.LabRequestStack.LabRequestTabs.ViewHistory}
          component={ViewHistoryScreen}
        />
      </Tabs.Navigator>
    </>
  );
};

export const LabRequestTabs = compose(withPatient)(DumbLabRequestTabs);
