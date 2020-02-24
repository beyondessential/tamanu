import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/home/Home';
import { Routes } from '../../helpers/constants';
import { WelcomeIntroTabs } from './WelcomeIntro';
import { noSwipeGestureOnNavigator } from '../../helpers/navigators';

const Stack = createStackNavigator();

export const HomeStack = () => (
  <Stack.Navigator
    headerMode="none"
    screenOptions={noSwipeGestureOnNavigator}
  >
    <Stack.Screen
      name="welcome"
      component={WelcomeIntroTabs}
    />
    <Stack.Screen
      name={Routes.HomeStack.Home}
      component={HomeScreen}
    />
  </Stack.Navigator>
);
