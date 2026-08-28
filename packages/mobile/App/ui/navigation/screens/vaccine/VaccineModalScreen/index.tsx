import type { NavigationProp, RouteProp } from '@react-navigation/native';
import React, { type ReactElement, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import type { IPatient } from '~/types';
import { Database } from '~/infra/db';
import { returnToVaccineTable } from '~/ui/helpers/navigators';
import { patientKeys } from '~/ui/hooks/queries/queryKeys';
import { ErrorScreen } from '/components/ErrorScreen';
import { LoadingScreen } from '/components/LoadingScreen';
import { VaccineCard, type VaccineDataProps } from '/components/VaccineCard';
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

  const {
    data: administeredVaccine,
    error,
    isPending,
  } = useQuery({
    queryKey: [...patientKeys.administeredVaccines(patient.id), administeredVaccineId],
    queryFn: () => Database.models.AdministeredVaccine.getById(administeredVaccineId),
    enabled: administeredVaccineId !== undefined,
  });
  const isLoading = administeredVaccineId !== undefined && isPending;

  const vaccineData = useMemo(
    () =>
      administeredVaccine
        ? { ...vaccine, administeredVaccine, status: administeredVaccine.status }
        : vaccine,
    [administeredVaccine, vaccine],
  );

  const onNavigateBack = useCallback(() => void returnToVaccineTable(navigation), [navigation]);

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
