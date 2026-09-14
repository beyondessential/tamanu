import React, { type ReactElement } from 'react';
import type { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { ProgramViewHistoryScreen } from '../screens/programs/ProgramViewHistoryScreen';
import { StackHeader } from '/components/StackHeader';
import { TopTabNavigator, TopTabScreen } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import type { IPatient } from '~/types';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';
import { ProgramListScreen } from '../screens/programs/ProgramListScreen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

interface NewProgramEntryTabsProps {
  navigation: NavigationProp<any>;
  selectedPatient: IPatient;
}

const TabNavigator = ({ navigation, selectedPatient }: NewProgramEntryTabsProps): ReactElement => {
  return (
    <FullView>
      <StackHeader title={joinNames(selectedPatient)} onGoBack={navigation.goBack} />
      <TopTabNavigator>
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText stringId="program.action.viewHistory" fallback="View history" />
            ),
          }}
          name={Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.ViewHistory}
          component={ProgramViewHistoryScreen}
        />
        <TopTabScreen
          options={{
            tabBarLabel: () => (
              <TranslatedText stringId="program.action.newForm" fallback="New form" />
            ),
          }}
          name={Routes.HomeStack.ProgramStack.ProgramTabs.SurveyTabs.AddDetails}
          component={ProgramListScreen}
        />
      </TopTabNavigator>
    </FullView>
  );
};

export const ProgramTabs = compose(withPatient)(TabNavigator);
