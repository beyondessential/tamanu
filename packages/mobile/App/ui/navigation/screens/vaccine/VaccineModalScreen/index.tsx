import React, { ReactElement, useCallback } from 'react';
import { RouteProp, NavigationProp } from '@react-navigation/native';

import { IPatient } from '~/types';
import { FullView } from '/styled/common';
import { Routes } from '/helpers/routes';
import { VaccineCard, VaccineDataProps } from '/components/VaccineCard';
import { theme } from '/styled/theme';

type VaccineModalParams = {
  VaccineModal: {
    vaccine: VaccineDataProps;
    patient: IPatient;
  };
};

type VaccineModalRouteProps = RouteProp<VaccineModalParams, 'VaccineModal'>;

type VaccineModalScreenProps = {
  navigation: NavigationProp<any>;
  route: VaccineModalRouteProps;
};

export const VaccineModalScreen = ({
  route,
  navigation,
}: VaccineModalScreenProps): ReactElement => {
  const { vaccine, patient } = route.params;

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const onNavigateToEditDetails = useCallback(() => {
    navigation.navigate(Routes.HomeStack.VaccineStack.NewVaccineTabs.Index, {
      vaccine,
      patient,
    });
  }, [vaccine]);

  return (
    <FullView background={theme.colors.WHITE}>
      {vaccine && (
        <VaccineCard
          onCloseModal={onNavigateBack}
          onEditDetails={onNavigateToEditDetails}
          vaccineData={vaccine}
        />
      )}
    </FullView>
  );
};
