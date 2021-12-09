import React, { FunctionComponent, useContext } from 'react';
// Helpers
import { Routes } from '/helpers/routes';
import { noSwipeGestureOnNavigator } from '/helpers/navigators';
//Stacks
import { createStackNavigator } from '@react-navigation/stack';
import { SignUpStack } from './SignUp';
import { HomeStack } from './Home';
import { useFacility } from '~/ui/contexts/FacilityContext';
import AuthContext from '~/ui/contexts/AuthContext';
import { AutocompleteModalScreen } from '~/ui/components/AutocompleteModal';
import { SelectFacilityScreen } from '~/ui/navigation/screens/signup/SelectFacilityScreen';

const Stack = createStackNavigator();

// TODO: should consolidate this w/ the logic in SignIn.tsx
function getSignInFlowRoute() {
  const authCtx = useContext(AuthContext);
  const { facilityId } = useFacility();
  if (!authCtx.isUserAuthenticated()) {
    return Routes.SignUpStack.Index;
  } else if (!facilityId) {
    return Routes.SignUpStack.SelectFacility;
  } else {
    return Routes.HomeStack.Index;
  }
}

export const Core: FunctionComponent<any> = () => {
  const initialRouteName = getSignInFlowRoute();

  return (
    <Stack.Navigator
      headerMode="none"
      initialRouteName={initialRouteName}
    >
      <Stack.Screen name={Routes.Autocomplete.Modal} component={AutocompleteModalScreen} />
      <Stack.Screen name={Routes.SignUpStack.Index} component={SignUpStack} />
      <Stack.Screen name={Routes.SignUpStack.SelectFacility} component={SelectFacilityScreen} />
      <Stack.Screen
        options={noSwipeGestureOnNavigator}
        name={Routes.HomeStack.Index}
        component={HomeStack}
      />
    </Stack.Navigator>
  );
};
