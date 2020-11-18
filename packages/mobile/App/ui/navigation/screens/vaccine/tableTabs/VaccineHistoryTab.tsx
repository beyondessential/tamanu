import React, { ReactElement, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { NavigationProp } from '@react-navigation/native';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { VaccinesTable } from '/components/VaccinesTable';
import { VaccineStatus } from '/helpers/constants';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';

interface VaccineHistoryTabProps {
  navigation: NavigationProp<any>;
  route: {
    name: string;
  };
}

export const VaccineHistoryTabComponent = ({
  route,
  navigation,
  selectedPatient,
}: VaccineHistoryTabProps): ReactElement => {
  const onNavigateToClickedCell = useCallback(item => {
    if (item.status === VaccineStatus.SCHEDULED) {
      navigation.navigate(Routes.HomeStack.VaccineStack.NewVaccineTabs.Index, {
        vaccine: item,
      });
    } else {
      navigation.navigate(Routes.HomeStack.VaccineStack.VaccineModalScreen, {
        vaccine: item,
      });
    }
  }, []);

  const categoryName = route.name; // todo: figure out real category name later
  return (
    <StyledSafeAreaView flex={1}>
      <StatusBar barStyle="light-content" />
      <FullView>
        <ScrollView>
          <VaccinesTable
            selectedPatient={selectedPatient}
            categoryName={categoryName}
            onPressItem={onNavigateToClickedCell}
          />
        </ScrollView>
      </FullView>
    </StyledSafeAreaView>
  );
};

export const VaccineHistoryTab = compose(withPatient)(VaccineHistoryTabComponent);
