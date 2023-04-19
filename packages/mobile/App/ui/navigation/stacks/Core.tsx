import React, { FunctionComponent } from 'react';
// Helpers
import { Routes } from '/helpers/routes';
import { noSwipeGestureOnNavigator } from '/helpers/navigators';
//Stacks
import { createStackNavigator } from '@react-navigation/stack';
import { SignUpStack } from './SignUp';
import { HomeStack } from './Home';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { useAuth } from '~/ui/contexts/AuthContext';
import { AutocompleteModalScreen } from '~/ui/components/AutocompleteModal';
import { SelectFacilityScreen } from '~/ui/navigation/screens/signup/SelectFacilityScreen';

const Stack = createStackNavigator();

function getSignInFlowRoute(): string {
  const { signedIn } = useAuth();
  const { facilityId } = useFacility();
  if (!signedIn) {
    return Routes.SignUpStack.Index;
  } else if (!facilityId) {
    return Routes.SignUpStack.SelectFacility;
  }
  return Routes.HomeStack.Index;
}

export const Core: FunctionComponent<any> = () => {
  const initialRouteName = getSignInFlowRoute();

  return (
    <Stack.Navigator headerMode="none" initialRouteName={initialRouteName}>
      <Stack.Screen name={Routes.Autocomplete.Modal} component={AutocompleteModalScreen} />
      <Stack.Screen
        name={Routes.SignUpStack.Index}
        component={SignUpStack}
        initialParams={{ signedOutFromInactivity: false }}
      />
      <Stack.Screen name={Routes.SignUpStack.SelectFacility} component={SelectFacilityScreen} />
      <Stack.Screen
        options={noSwipeGestureOnNavigator}
        name={Routes.HomeStack.Index}
        component={HomeStack}
      />
    </Stack.Navigator>
  );
};
