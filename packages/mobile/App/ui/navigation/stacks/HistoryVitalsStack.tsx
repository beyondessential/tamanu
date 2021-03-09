import React, { ReactElement, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Routes } from '/helpers/routes';
import {
  FullView,
  RowView,
  StyledTouchableOpacity,
  StyledSafeAreaView,
  StyledText,
} from '/styled/common';
import { ArrowLeftIcon, KebabIcon } from '/components/Icons';
import { HistoryVitalsTabs } from './HistoryVitalsTabs';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { ErrorBoundary } from '~/ui/components/ErrorBoundary';

const Stack = createStackNavigator();

interface HistoryVitalsStackProps {
  navigation: NavigationProp<any>;
}

export const HistoryVitalsStack = ({
  navigation,
}: HistoryVitalsStackProps): ReactElement => {
  const goBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const navigateToPatientActions = useCallback(() => {
    navigation.navigate(Routes.HomeStack.PatientActions);
  }, []);
  return (
    <ErrorBoundary>
      <FullView>
        <StyledSafeAreaView
          background={theme.colors.PRIMARY_MAIN}
          height={screenPercentageToDP(19.87, Orientation.Height)}
        >
          <RowView justifyContent="space-between">
            <StyledTouchableOpacity
              padding={screenPercentageToDP(2.43, Orientation.Height)}
              onPress={goBack}
            >
              <ArrowLeftIcon
                height={screenPercentageToDP(2.43, Orientation.Height)}
                width={screenPercentageToDP(2.43, Orientation.Height)}
              />
            </StyledTouchableOpacity>
            <StyledTouchableOpacity
              padding={screenPercentageToDP(2.43, Orientation.Height)}
              onPress={navigateToPatientActions}
            >
              <KebabIcon />
            </StyledTouchableOpacity>
          </RowView>
          <StyledText
            marginBottom={screenPercentageToDP(3.64, Orientation.Height)}
            marginLeft={screenPercentageToDP(2.43, Orientation.Height)}
            fontWeight="bold"
            fontSize={screenPercentageToDP(3.4, Orientation.Height)}
            color={theme.colors.WHITE}
          >
            History
          </StyledText>
        </StyledSafeAreaView>
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
