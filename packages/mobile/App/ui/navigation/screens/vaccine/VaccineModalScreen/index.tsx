import React, { ReactElement, useCallback } from 'react';
import { RouteProp, NavigationProp } from '@react-navigation/native';

import { FullView } from '/styled/common';
import { Routes } from '/helpers/routes';
import { VaccineCard, VaccineDataProps } from '/components/VaccineCard';
import { theme } from '/styled/theme';

type VaccineModalParams = {
  VaccineModal: {
    vaccine: VaccineDataProps;
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
  const { vaccine } = route.params;

  const onNavigateBack = useCallback(() => {
    navigation.goBack();
  }, []);

  const onNavigateToEditDetails = useCallback(() => {
    navigation.navigate(Routes.HomeStack.VaccineStack.NewVaccineTabs.Index, {
      vaccine,
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
