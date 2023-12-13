import React, { FunctionComponent } from 'react';
// Helpers
import { noSwipeGestureOnNavigator } from '/helpers/navigators';
import { Routes } from '/helpers/routes';
// Stacks
import { createStackNavigator } from '@react-navigation/stack';
import { AutocompleteModalScreen } from '~/ui/components/AutocompleteModal';
import { useAuth } from '~/ui/contexts/AuthContext';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { SelectFacilityScreen } from '~/ui/navigation/screens/signup/SelectFacilityScreen';
import { HomeStack } from './Home';
import { SignUpStack } from './SignUp';

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
