import React, { FunctionComponent, useContext } from 'react';
// Helpers
import { Routes } from '/helpers/routes';
import { noSwipeGestureOnNavigator } from '/helpers/navigators';
//Stacks
import { createStackNavigator } from '@react-navigation/stack';
import { SignUpStack } from './SignUp';
import { HomeStack } from './Home';
import AuthContext from '~/ui/contexts/AuthContext';
import { AutocompleteModalScreen } from '~/ui/components/AutocompleteModal';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

export const Core: FunctionComponent<any> = () => {
  const authCtx = useContext(AuthContext);
  return (
    <ErrorBoundary errorKey={'hi'}>
      <Stack.Navigator      

        headerMode="none"
        initialRouteName={
          authCtx.isUserAuthenticated()
            ? Routes.HomeStack.Index
            : Routes.SignUpStack.Index
        }
      >
          <Stack.Screen name={Routes.Autocomplete.Modal} component={AutocompleteModalScreen} />
          <Stack.Screen name={Routes.SignUpStack.Index} component={SignUpStack} />
          <Stack.Screen
            options={noSwipeGestureOnNavigator}
            name={Routes.HomeStack.Index}
            component={HomeStack}
          />
      </Stack.Navigator>
    </ErrorBoundary>
  );
};
