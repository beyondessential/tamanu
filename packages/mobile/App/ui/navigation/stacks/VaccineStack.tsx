import React, { type ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import {
  createStackNavigator,
  type StackHeaderProps,
  TransitionPresets,
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

const VaccineHeaderComponent = ({
  navigation,
  selectedPatient,
}: VaccineHeaderProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <StackHeader
      title={<TranslatedText stringId="patient.vaccine.title" fallback="Vaccine" />}
      subtitle={joinNames(selectedPatient)}
      onGoBack={goBack}
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

export const VaccineStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator>
      <Stack.Screen
        component={VaccineTableTabs}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Index}
        options={{ header: renderVaccineHeader }}
      />
      <Stack.Screen
        options={{
          header: (): null => null,
          ...TransitionPresets.ModalSlideFromBottomIOS,
        }}
        name={Routes.HomeStack.VaccineStack.NewVaccineTabs.Index}
        component={NewVaccineTabs}
      />
      <Stack.Screen
        options={{
          header: (): null => null,
          ...TransitionPresets.ModalSlideFromBottomIOS,
        }}
        name={Routes.HomeStack.VaccineStack.VaccineModalScreen}
        component={VaccineModalScreen}
      />
    </Stack.Navigator>
  </ErrorBoundary>
);
