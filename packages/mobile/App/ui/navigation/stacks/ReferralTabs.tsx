import React, { ReactElement, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { Routes } from '/helpers/routes';
import { StackHeader } from '/components/StackHeader';
import { compose } from 'redux';
import { createTopTabNavigator } from '/components/TopTabNavigator';
import { withPatient } from '/containers/Patient';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { joinNames } from '/helpers/user';
import { AddRefferalDetailScreen } from '../screens/referrals/AddReferralDetailScreen';

const Tabs = createTopTabNavigator();

type ReferralTabsProps = {
  navigation: NavigationProp<any>;
} & BaseAppProps;

const TabNavigator = ({
  navigation,
  selectedPatient,
}: ReferralTabsProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);
  return (
    <React.Fragment>
      <StackHeader
        title="Referrals"
        subtitle={joinNames(selectedPatient)}
        onGoBack={goBack}
      />
      <Tabs.Navigator swipeEnabled={false}>
        <Tabs.Screen
          options={{
            title: 'Add Details',
          }}
          name={Routes.HomeStack.CheckUpStack.CheckUpTabs.AddDetails}
          component={AddRefferalDetailScreen}
        />
        <Tabs.Screen
          options={{
            title: 'VIEW HISTORY',
          }}
          name={Routes.HomeStack.CheckUpStack.CheckUpTabs.ViewHistory}
          component={AddRefferalDetailScreen}
        />
      </Tabs.Navigator>
    </React.Fragment>
  );
};

export const ReferralTabs = compose(withPatient)(TabNavigator);
