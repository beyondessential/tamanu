import React, { ReactElement, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { NavigationProp } from '@react-navigation/native';
import { FullView, StyledSafeAreaView } from '/styled/common';
import { VaccinesTable } from '/components/VaccinesTable';
import {
  vaccineHistoryAdolecentList,
  vaccineHistoryAdultList,
  vaccineHistoryList,
} from '/components/VaccinesTable/fixture';
import { VaccineStatus } from '/helpers/constants';
import { Routes } from '/helpers/routes';

interface VaccineHistoryTabProps {
  navigation: NavigationProp<any>;
  route: {
    name: string;
  };
}

export const VaccineHistoryTab = ({
  route,
  navigation,
}: VaccineHistoryTabProps): ReactElement => {
  let data;
  const onNavigateToClickedCell = useCallback(item => {
    if (item.status === VaccineStatus.SCHEDULED) {
      navigation.navigate(Routes.HomeStack.VaccineStack.NewVaccineTabs.name, {
        vaccine: item,
      });
    } else {
      navigation.navigate(Routes.HomeStack.VaccineStack.VaccineModalScreen, {
        vaccine: item,
      });
    }
  }, []);
  switch (route.name) {
    case Routes.HomeStack.VaccineStack.VaccineTabs.AdultTab:
      data = vaccineHistoryAdultList;
      break;
    case Routes.HomeStack.VaccineStack.VaccineTabs.AdolescentTab:
      data = vaccineHistoryAdolecentList;
      break;
    case Routes.HomeStack.VaccineStack.VaccineTabs.ChildhoodTab:
      data = vaccineHistoryList;
      break;
    default:
      data = vaccineHistoryList;
      break;
  }
  return (
    <StyledSafeAreaView flex={1}>
      <StatusBar barStyle="light-content" />
      <FullView>
        <ScrollView>
          <VaccinesTable data={data} onPressItem={onNavigateToClickedCell} />
        </ScrollView>
      </FullView>
    </StyledSafeAreaView>
  );
};
