import { ErrorBoundary } from '/components/ErrorBoundary';
import { Routes } from '/helpers/routes';
import { BaseAppProps } from '/interfaces/BaseAppProps';
import { FullView } from '/styled/common';
import { NavigationProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { ReactElement, useCallback } from 'react';
import { compose } from 'redux';
import { StackHeader } from '~/ui/components/StackHeader';
import { withPatient } from '~/ui/containers/Patient';
import { joinNames } from '~/ui/helpers/user';
import { HistoryVitalsTabs } from './HistoryVitalsTabs';

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
        <StackHeader title="History" subtitle={joinNames(selectedPatient)} onGoBack={goBack} />
        <Stack.Navigator headerMode="none">
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
