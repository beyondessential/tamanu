import React, { FunctionComponent } from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { IntroScreen } from '../screens/signup/Intro';
import { SignIn } from '../screens/signup/SignIn';
import { Routes } from '../../helpers/constants';

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
  </Stack.Navigator>
);
