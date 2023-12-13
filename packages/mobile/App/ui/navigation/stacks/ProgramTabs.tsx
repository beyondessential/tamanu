import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { Routes } from '/helpers/routes';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';
import { NavigationProp } from '@react-navigation/native';
import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { IPatient } from '~/types';
import { ProgramListScreen } from '../screens/programs/ProgramListScreen';
import { ProgramViewHistoryScreen } from '../screens/programs/ProgramViewHistoryScreen';

const Tabs = createTopTabNavigator();

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
};

const TabNavigator = ({
  navigation,
  selectedPatient,
}: NewProgramEntryTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);
  return (
    <FullView>
      <StackHeader title={joinNames(selectedPatient)} onGoBack={goBack} />
      <Tabs.Navigator>
        <Tabs.Screen
          initialParams={{
            selectedPatient,
          }}
          options={{
            title: 'View history',
          }}
          name={Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.ViewHistory}
          component={ProgramViewHistoryScreen}
        />
        <Tabs.Screen
          initialParams={{
            selectedPatient,
          }}
          options={{
            title: 'New form',
          }}
          name={Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.AddDetails}
          component={ProgramListScreen}
        />
      </Tabs.Navigator>
    </FullView>
  );
};

export const ProgramTabs = compose(withPatient)(TabNavigator);
