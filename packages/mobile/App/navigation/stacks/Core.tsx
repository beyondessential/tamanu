import React, { FunctionComponent } from 'react';
//Stacks
import { createStackNavigator } from '@react-navigation/stack';
import { SignUpStack } from './SignUp';
import { HomeStack } from './Home';
import { Routes } from '../../helpers/constants';
import { noSwipeGestureOnNavigator } from '../../helpers/navigators';

const Stack = createStackNavigator();

export const Core: FunctionComponent<any> = () => (
  <Stack.Navigator
    headerMode="none"
  >
    <Stack.Screen
      name={Routes.SignUpStack.name}
      component={SignUpStack}
    />
    <Stack.Screen
      options={noSwipeGestureOnNavigator}
      name={Routes.HomeStack.name}
      component={HomeStack}
    />
  </Stack.Navigator>
);
