import React, { type ReactElement } from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
// helpers
import { Routes } from '/helpers/routes';
// Screens
import { SignIn } from '../screens/signup/SignIn';

import { ResetPassword } from '../screens/signup/ResetPassword';
import { ChangePassword } from '../screens/signup/ChangePassword';

import { LanguageSelectScreen } from '../screens/signup/LanguageSelectScreen';
import type { IndexStackProps } from '~/ui/interfaces/Screens/SignUpStack';

const Stack = createStackNavigator();

const TransitionStyle = TransitionPresets.SlideFromRightIOS;

export const SignUpStack = ({ route }: IndexStackProps): ReactElement => {
  const { signedOutFromInactivity } = route.params;
  return (
    <Stack.Navigator
      initialRouteName={Routes.SignUpStack.SignIn}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        component={SignIn}
        name={Routes.SignUpStack.SignIn}
        initialParams={{ signedOutFromInactivity }}
        options={TransitionStyle}
      />
      <Stack.Screen
        name={Routes.SignUpStack.ResetPassword}
        component={ResetPassword}
        options={TransitionStyle}
      />
      <Stack.Screen
        name={Routes.SignUpStack.ChangePassword}
        component={ChangePassword}
        options={TransitionStyle}
      />
      <Stack.Screen
        name={Routes.SignUpStack.LanguageSelect}
        component={LanguageSelectScreen}
        options={TransitionStyle}
      />
    </Stack.Navigator>
  );
};
