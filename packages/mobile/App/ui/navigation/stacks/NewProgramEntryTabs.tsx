import React, { ReactElement, useCallback } from 'react';
import { RouteProp, NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { ProgramAddDetailsScreen } from '../screens/programs/tabs/ProgramAddDetailsScreen';
import { ProgramViewHistoryScreen } from '../screens/programs/tabs/ProgramViewHistoryScreen';
import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { ProgramModel } from '/models/Program';
import { withPatient } from '/containers/Patient';
import { PatientModel } from '/models/Patient';
import { joinNames } from '/helpers/user';
import { FullView } from '/styled/common';

const Tabs = createTopTabNavigator();

type NewProgramEntryTabsParams = {
  NewProgramEntryTabs: {
    program: ProgramModel;
  };
};

type NewProgramEntryTabsRouteProps = RouteProp<
  NewProgramEntryTabsParams,
  'NewProgramEntryTabs'
>;

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
  route: NewProgramEntryTabsRouteProps;
  selectedPatient: PatientModel;
};

const TabNavigator = ({
  navigation,
  route,
  selectedPatient,
}: NewProgramEntryTabsProps): ReactElement => {
  const { program } = route.params;
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);
  return (
    <FullView>
      <StackHeader
        title={program.name}
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      <Tabs.Navigator>
        <Tabs.Screen
          initialParams={{
            program,
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
            program,
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
