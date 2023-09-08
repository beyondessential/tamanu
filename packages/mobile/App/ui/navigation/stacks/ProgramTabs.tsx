import React, { ReactElement, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { ProgramViewHistoryScreen } from '../screens/programs/tabs/ProgramViewHistoryScreen';
import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { IPatient, } from '~/types';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';
import { ProgramListScreen } from '../screens/programs/ProgramListScreen';

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
            // surveyId,
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
            // surveyId,
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
