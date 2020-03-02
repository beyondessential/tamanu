
import React, { ReactElement } from 'react';
import {
  MaterialTopTabBar,
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { compose } from 'redux';
import { PatientHome } from '../screens/home/homeTabs/PatientHome';
import { StyledSafeAreaView } from '../../styled/common';
import { theme } from '../../styled/theme';
import { HomeScreen } from '../screens/home/homeTabs/Home';
import { withPatient } from '../../containers/Patient';
import { BaseAppProps } from '../../interfaces/BaseAppProps';

const Tabs = createMaterialTopTabNavigator();

const HomeTabBar = (props: MaterialTopTabBarProps): ReactElement => (
  <StyledSafeAreaView background={theme.colors.PRIMARY_MAIN}>
    <MaterialTopTabBar {...props} />
  </StyledSafeAreaView>
);

const TabNavigator = ({ selectedPatient }:BaseAppProps): ReactElement => {
  console.log(selectedPatient);
  return (
    <Tabs.Navigator
      tabBarPosition="bottom"
      tabBar={HomeTabBar}
      tabBarOptions={{
        style: {
          height: 70,
          backgroundColor: theme.colors.PRIMARY_MAIN,
        },
      }}
    >
      <Tabs.Screen name="test" component={selectedPatient ? PatientHome : HomeScreen} />
    </Tabs.Navigator>
  );
};

export const HomeTabs = compose(withPatient)(TabNavigator);
