import React, { ReactElement, useCallback } from 'react';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { ProgramAddDetailsScreen } from '../screens/programs/tabs/ProgramAddDetailsScreen';
import { ProgramViewHistoryScreen } from '../screens/programs/tabs/ProgramViewHistoryScreen';
import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { IPatient, IProgram } from '~/types';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';

const Tabs = createTopTabNavigator();

type NewProgramEntryTabsParams = {
  NewProgramEntryTabs: {
    program: IProgram;
  };
};

type NewProgramEntryTabsRouteProps = RouteProp<
  NewProgramEntryTabsParams,
  'NewProgramEntryTabs'
>;

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
  route: NewProgramEntryTabsRouteProps;
  selectedPatient: IPatient;
};

const TabNavigator = ({
  navigation,
  route,
  selectedPatient,
}: NewProgramEntryTabsProps): ReactElement => {
  const { survey } = route.params;
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);
  return (
    <FullView>
      <StackHeader
        title={survey.name}
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      <Tabs.Navigator>
        <Tabs.Screen
          initialParams={{
            survey,
            selectedPatient,
          }}
          options={{
            title: 'Add Details',
          }}
          name={Routes.HomeStack.ProgramStack.ProgramTabs.AddDetails}
          component={ProgramAddDetailsScreen}
        />
        <Tabs.Screen
          initialParams={{
            survey,
          }}
          options={{
            title: 'VIEW HISTORY',
          }}
          name={Routes.HomeStack.ProgramStack.ProgramTabs.ViewHistory}
          component={ProgramViewHistoryScreen}
        />
      </Tabs.Navigator>
    </FullView>
  );
};

export const NewProgramEntryTabs = compose(withPatient)(TabNavigator);
