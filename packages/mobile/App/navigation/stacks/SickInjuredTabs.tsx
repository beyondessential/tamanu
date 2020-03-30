import React, { ReactElement, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { PatientModel } from '/models/Patient';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';
import { AddSickDetailScreen } from '../screens/sickOrInjured/AddSickDetails';

const Tabs = createTopTabNavigator();

type SickOrInjuredTabsProps = {
  navigation: NavigationProp<any>;
  selectedPatient: PatientModel;
};

const TabNavigator = ({
  navigation,
  selectedPatient,
}: SickOrInjuredTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);
  return (
    <FullView>
      <StackHeader
        title="Sick or Injured"
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      <Tabs.Navigator>
        <Tabs.Screen
          options={{
            title: 'ADD DETAILS',
          }}
          name={Routes.HomeStack.SickOrInjuredTabs.AddSickDetailScreen}
          component={AddSickDetailScreen}
        />
        <Tabs.Screen
          options={{
            title: 'VIEW HISTORY',
          }}
          name={Routes.HomeStack.SickOrInjuredTabs.ViewHistory}
          component={AddSickDetailScreen}
        />
      </Tabs.Navigator>
    </FullView>
  );
};

export const SickOrInjuredTabs = compose(withPatient)(TabNavigator);
