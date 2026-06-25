import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { createStackNavigator, StackHeaderProps, TransitionPresets } from '@react-navigation/stack';
import { VaccineTableTabs } from './VaccineTableTabs';
import { NewVaccineTabs } from './NewVaccineTabs';
import { StackHeader } from '/components/StackHeader';
import { Routes } from '/helpers/routes';
import { VaccineModalScreen } from '../screens/vaccine/VaccineModalScreen';
import { withPatient } from '~/ui/containers/Patient';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { joinNames } from '/helpers/user';
import { IPatient } from '~/types';

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

const VaccineHeader = (props: StackHeaderProps): ReactElement => (
  <VaccineHeaderWithPatient {...props} />
);

export const VaccineStack = (): ReactElement => (
  <ErrorBoundary>
    <Stack.Navigator>
      <Stack.Screen
        options={{
          header: VaccineHeader,
        }}
        name={Routes.HomeStack.VaccineStack.VaccineTabs.Index}
        component={VaccineTableTabs}
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
