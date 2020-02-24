import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// helpers
import { Routes } from '../../../helpers/constants';
// Screens
import { Intro } from '../../screens/home/Intro';
import { AppIntro1, AppIntro2, AppIntro3 } from '../../../components/Icons';
import { noTabComponent } from '../../../helpers/navigators';

const Tabs = createMaterialTopTabNavigator();

export const WelcomeIntroTabs = () => (
  <Tabs.Navigator tabBar={noTabComponent}>
    <Tabs.Screen
      name="step1"
      component={Intro}
      initialParams={{
        step: 1,
        Icon: AppIntro1,
        nextRoute: 'step2',
        title: 'Search for patients',
        message:
          'All patients in the system are searchable, no internet is required after the first login. Start working immediately.',
      }}
    />
    <Tabs.Screen
      name="step2"
      component={Intro}
      initialParams={{
        step: 2,
        Icon: AppIntro2,
        nextRoute: 'step3',
        title: 'Search for patients',
        message:
          'All patients in the system are searchable, no internet is required after the first login. Start working immediately.',
      }}
    />
    <Tabs.Screen
      name="step3"
      component={Intro}
      initialParams={{
        step: 3,
        Icon: AppIntro3,
        nextRoute: 'step3',
        title: 'Search for patients',
        message:
          'All patients in the system are searchable, no internet is required after the first login. Start working immediately.',
      }}
    />
  </Tabs.Navigator>
);
