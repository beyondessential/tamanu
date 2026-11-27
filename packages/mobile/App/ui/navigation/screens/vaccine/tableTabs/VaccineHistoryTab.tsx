import React, { type ReactElement, useCallback } from 'react';
import { StatusBar } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { VaccinesTable } from '/components/VaccinesTable';
import { Routes } from '/helpers/routes';
import { useSelectedPatient } from '~/ui/contexts/SelectedPatientContext';
import { VaccineStatus } from '~/ui/helpers/patient';

interface VaccineHistoryTabProps {
  navigation: NavigationProp<any>;
  route: {
    name: string;
  };
}

export const VaccineHistoryTab = ({ route, navigation }: VaccineHistoryTabProps): ReactElement => {
  const { selectedPatient } = useSelectedPatient();
  const category = route.name.split('/')[route.name.split('/').length - 1];
  const onNavigateToClickedCell = useCallback(item => {
    if (item.status === VaccineStatus.SCHEDULED) {
      navigation.navigate(Routes.HomeStack.VaccineStack.NewVaccineTabs.Index, {
        vaccine: item,
        patient: selectedPatient,
      });
    } else {
      navigation.navigate(Routes.HomeStack.VaccineStack.VaccineModalScreen, {
        vaccine: item,
        patient: selectedPatient,
      });
    }
  }, []);

  return (
    <StyledSafeAreaView flex={1}>
      <StatusBar barStyle="light-content" />
      <FullView>
        <VaccinesTable
          selectedPatient={selectedPatient}
          categoryName={category}
          onPressItem={onNavigateToClickedCell}
        />
      </FullView>
    </StyledSafeAreaView>
  );
};
