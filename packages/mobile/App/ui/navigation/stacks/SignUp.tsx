import { createStackNavigator } from '@react-navigation/stack';
import React, { type ReactElement } from 'react';
import type { IndexStackProps } from '~/ui/interfaces/Screens/SignUpStack';
import { ChangePassword } from '../screens/signup/ChangePassword';
import { LanguageSelectScreen } from '../screens/signup/LanguageSelectScreen';
import { ResetPassword } from '../screens/signup/ResetPassword';
import { SignIn } from '../screens/signup/SignIn';
import { Routes } from '/helpers/routes';

const Stack = createStackNavigator();

const screenOptions = { headerShown: false } as const;

export const SignUpStack = ({ route }: IndexStackProps): ReactElement => {
  const { signedOutFromInactivity } = route.params;
  return (
    <Stack.Navigator initialRouteName={Routes.SignUpStack.SignIn} screenOptions={screenOptions}>
      <Stack.Screen
        component={SignIn}
        name={Routes.SignUpStack.SignIn}
        initialParams={{ signedOutFromInactivity }}
      />
      <Stack.Screen name={Routes.SignUpStack.ResetPassword} component={ResetPassword} />
      <Stack.Screen name={Routes.SignUpStack.ChangePassword} component={ChangePassword} />
      <Stack.Screen name={Routes.SignUpStack.LanguageSelect} component={LanguageSelectScreen} />
    </Stack.Navigator>
  );
};
