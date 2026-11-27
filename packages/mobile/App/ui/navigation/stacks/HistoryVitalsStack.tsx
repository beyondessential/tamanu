import React, { type ReactElement } from 'react';
import type { NavigationProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { FullView } from '/styled/common';
import { HistoryVitalsTabs } from './HistoryVitalsTabs';
import { ErrorBoundary } from '/components/ErrorBoundary';
import type { BaseAppProps } from '/interfaces/BaseAppProps';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { StackHeader } from '~/ui/components/StackHeader';
import { joinNames } from '~/ui/helpers/user';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const Stack = createStackNavigator();

interface HistoryVitalsStackProps extends BaseAppProps {
  navigation: NavigationProp<any>;
}

export const HistoryVitalsStack = ({ navigation }: HistoryVitalsStackProps): ReactElement => {
  const { selectedPatient } = useSelectedPatient();
  return (
    <ErrorBoundary>
      <FullView>
        <StackHeader
          title={<TranslatedText stringId="patient.vitals.history.title" fallback="History" />}
          subtitle={joinNames(selectedPatient)}
          onGoBack={navigation.goBack}
        />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name={Routes.HomeStack.HistoryVitalsStack.View}
            component={HistoryVitalsTabs}
          />
        </Stack.Navigator>
      </FullView>
    </ErrorBoundary>
  );
};
