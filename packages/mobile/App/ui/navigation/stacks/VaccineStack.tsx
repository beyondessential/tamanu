import React, { type ReactElement } from 'react';
import { compose } from 'redux';
import {
  createStackNavigator,
  type StackHeaderProps,
  StackNavigationOptions,
} from '@react-navigation/stack';
import { VaccineTableTabs } from './VaccineTableTabs';
import { NewVaccineTabs } from './NewVaccineTabs';
import { StackHeader } from '/components/StackHeader';
import { Routes } from '/helpers/routes';
import { VaccineModalScreen } from '../screens/vaccine/VaccineModalScreen';
import { withPatient } from '~/ui/containers/Patient';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { joinNames } from '/helpers/user';
import type { IPatient } from '~/types';

const Stack = createStackNavigator();

type VaccineHeaderProps = StackHeaderProps & {
  selectedPatient: IPatient;
};

const VaccineHeaderComponent = ({ navigation, selectedPatient }: VaccineHeaderProps) => {
  return (
    <StackHeader
      title={<TranslatedText stringId="patient.vaccine.title" fallback="Vaccine" />}
      subtitle={joinNames(selectedPatient)}
      onGoBack={navigation.goBack}
    />
  );
};

const VaccineHeaderWithPatient = compose(withPatient)(VaccineHeaderComponent);

/**
 * Not a redundant wrapper! The stack `header` option is called as a plain render function (where
 * hooks aren’t allowed), not treated as a function component (where React Compiler can do its
 * optimisations).
 */
function renderVaccineHeader(props: StackHeaderProps): ReactElement {
  return <VaccineHeaderWithPatient {...props} />;
}

const screenOptions = { header: (): null => null } as const satisfies StackNavigationOptions;

export const VaccineStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator>
      <Stack.Screen
        component={VaccineTableTabs}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Index}
        options={{ header: renderVaccineHeader }}
      />
      <Stack.Screen
        component={NewVaccineTabs}
        name={Routes.HomeStack.VaccineStack.NewVaccineTabs.Index}
        options={screenOptions}
      />
      <Stack.Screen
        component={VaccineModalScreen}
        name={Routes.HomeStack.VaccineStack.VaccineModalScreen}
        options={screenOptions}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
