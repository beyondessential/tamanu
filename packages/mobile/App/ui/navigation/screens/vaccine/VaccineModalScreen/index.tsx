import { NavigationProp, RouteProp, useIsFocused } from '@react-navigation/native';
import React, { ReactElement, useCallback, useMemo } from 'react';

import { IPatient } from '~/types';
import { returnToVaccineTableWithRefresh } from '~/ui/helpers/navigators';
import { useBackendEffect } from '~/ui/hooks';
import { ErrorScreen } from '/components/ErrorScreen';
import { LoadingScreen } from '/components/LoadingScreen';
import { VaccineCard, VaccineDataProps } from '/components/VaccineCard';
import { Routes } from '/helpers/routes';
import { FullView } from '/styled/common';
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
  const administeredVaccineId = vaccine.administeredVaccine?.id;
  const isFocused = useIsFocused();

  /**
   * Ideally we’d declare, declaratively, the relevant vaccine data and delegate state management
   * to something like TanStack Query. In its absence, we use an Effect dependent on focus to
   * imperatively refetch data if and when the administered vaccine is edited.
   */
  const [administeredVaccine, error, isLoading] = useBackendEffect(
    ({ models }) => models.AdministeredVaccine.getById(administeredVaccineId),
    [administeredVaccineId, isFocused],
  );

  const vaccineData = useMemo(
    () =>
      administeredVaccine
        ? { ...vaccine, administeredVaccine, status: administeredVaccine.status }
        : vaccine,
    [administeredVaccine, vaccine],
  );

  const onNavigateBack = useCallback(() => {
    returnToVaccineTableWithRefresh(navigation, administeredVaccineId);
  }, [navigation, administeredVaccineId]);

  const onNavigateToEditDetails = useCallback(() => {
    navigation.navigate(Routes.HomeStack.VaccineStack.NewVaccineTabs.Index, {
      vaccine: vaccineData,
      patient,
    });
  }, [navigation, vaccineData, patient]);

  if (error) return <ErrorScreen error={error} />;
  if (isLoading) return <LoadingScreen />;

  return (
    <FullView background={theme.colors.WHITE}>
      {vaccineData && (
        <VaccineCard
          onCloseModal={onNavigateBack}
          onEditDetails={onNavigateToEditDetails}
          vaccineData={vaccineData}
        />
      )}
    </FullView>
  );
};
