import React, { FunctionComponent } from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
// Helpers
import { Routes } from '../../helpers/constants';
// Screens
import { SignIn } from '../screens/signup/SignIn';
import { IntroScreen } from '../screens/signup/Intro';
import { RegisterAccount } from '../screens/signup/RegisterAccount';

const Stack = createStackNavigator();

const TransitionStyle = TransitionPresets.SlideFromRightIOS;


export const SignUpStack: FunctionComponent<any> = () => (
  <Stack.Navigator
    headerMode="none"
  >
    <Stack.Screen
      name={Routes.SignUpStack.Intro}
      component={IntroScreen}
      options={TransitionStyle}
    />
    <Stack.Screen
      name={Routes.SignUpStack.SignIn}
      component={SignIn}
      options={TransitionStyle}
    />
    <Stack.Screen name={Routes.SignUpStack.RegisterAccount} component={RegisterAccount} />
  </Stack.Navigator>
);
