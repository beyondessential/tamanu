import React, { ReactElement, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import { FullView } from '/styled/common';
import { compose } from 'redux';
import { HistoryVitalsTabs } from './HistoryVitalsTabs';
import { ErrorBoundary } from '/components/ErrorBoundary';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { withPatient } from '~/ui/containers/Patient';
import { StackHeader } from '~/ui/components/StackHeader';
import { joinNames } from '~/ui/helpers/user';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const Stack = createStackNavigator();

interface HistoryVitalsStackProps extends BaseAppProps {
  navigation: NavigationProp<any>;
}

const TabNavigator = ({ navigation, selectedPatient }: HistoryVitalsStackProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  return (
    <ErrorBoundary>
      <FullView>
        <StackHeader
          title={<TranslatedText stringId="patient.vitals.history.title" fallback="History" />}
          subtitle={joinNames(selectedPatient)}
          onGoBack={goBack}
        />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name={Routes.HomeStack.HistoryVitalsStack.Index}
            component={HistoryVitalsTabs}
          />
        </Stack.Navigator>
      </FullView>
    </ErrorBoundary>
  );
};

export const HistoryVitalsStack = compose(withPatient)(TabNavigator);
