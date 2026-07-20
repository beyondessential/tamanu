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

  // The read-only view sits below the edit form in the stack, so returning here after an
  // edit no longer reliably re-applies the route params. Re-read the record from the DB
  // (keyed on focus) so the card always reflects the latest saved data rather than stale params.
  const isFocused = useIsFocused();
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
