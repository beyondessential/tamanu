import React, {FunctionComponent, useContext} from 'react';
// Helpers
import {Routes} from '/helpers/routes';
import {noSwipeGestureOnNavigator} from '/helpers/navigators';
//Stacks
import {createStackNavigator} from '@react-navigation/stack';
import {SignUpStack} from './SignUp';
import {HomeStack} from './Home';
import AuthContext from '../../contexts/authContext/AuthContext';

const Stack = createStackNavigator();

export const Core: FunctionComponent<any> = () => {
  const authCtx = useContext(AuthContext);
  return (
    <Stack.Navigator
      headerMode="none"
      initialRouteName={
        authCtx.isUserAuthenticated()
          ? Routes.HomeStack.name
          : Routes.SignUpStack.name
      }
    >
      <Stack.Screen name={Routes.SignUpStack.name} component={SignUpStack} />
      <Stack.Screen
        options={noSwipeGestureOnNavigator}
        name={Routes.HomeStack.name}
        component={HomeStack}
      />
    </Stack.Navigator>
  );
};
