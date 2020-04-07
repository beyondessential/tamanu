import React, { ReactElement, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { AddVitalsScreen, ViewHistoryScreen } from '../screens/checkup/tabs';

const Tabs = createTopTabNavigator();

type NewProgramEntryTabsProps = {
  navigation: NavigationProp<any>;
};

export const CheckUpTabs = ({
  navigation,
}: NewProgramEntryTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);
  return (
    <React.Fragment>
      <StackHeader title="Check up" subtitle="Ugyen Wangdi" onGoBack={goBack} />
      <Tabs.Navigator swipeEnabled={false}>
        <Tabs.Screen
          options={{
            title: 'Add Details',
          }}
          name={Routes.HomeStack.CheckUpStack.CheckUpTabs.AddDetails}
          component={AddVitalsScreen}
        />
        <Tabs.Screen
          options={{
            title: 'VIEW HISTORY',
          }}
          name={Routes.HomeStack.CheckUpStack.CheckUpTabs.ViewHistory}
          component={ViewHistoryScreen}
        />
      </Tabs.Navigator>
    </React.Fragment>
  );
};
