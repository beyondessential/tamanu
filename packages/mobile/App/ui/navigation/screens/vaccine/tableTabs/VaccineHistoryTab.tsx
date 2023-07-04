import React, { ReactElement, useCallback, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { VaccinesTable } from '/components/VaccinesTable';
import { Routes } from '/helpers/routes';
import { compose } from 'redux';
import { withPatient } from '~/ui/containers/Patient';
import { IPatient } from '~/types';
import { VaccineStatus } from '~/ui/helpers/patient';

interface VaccineHistoryTabProps {
  navigation: NavigationProp<any>;
  route: {
    name: string;
  };
  selectedPatient: IPatient;
}

export const VaccineHistoryTabComponent = ({
  route,
  navigation,
  selectedPatient,
}: VaccineHistoryTabProps): ReactElement => {
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

export const VaccineHistoryTab = compose(withPatient)(VaccineHistoryTabComponent);
