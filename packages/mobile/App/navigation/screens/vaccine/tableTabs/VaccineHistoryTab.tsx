import React, { ReactElement, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { NavigationProp } from '@react-navigation/native';
import SafeAreaView from 'react-native-safe-area-view';
import { FullView } from '../../../../styled/common';
import { VaccinesTable } from '../../../../components/VaccinesTable';
import {
  vaccineHistoryAdolecentList,
  vaccineHistoryAdultList,
  vaccineHistoryList,
} from '../../../../components/VaccinesTable/fixture';
import { Routes, VaccineStatus } from '../../../../helpers/constants';

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
  const onNavigateToClickedCell = useCallback((item) => {
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
    case Routes.HomeStack.VaccineStack.VaccineTabs.AdulTab:
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
    <FullView>
      <SafeAreaView>
        <StatusBar barStyle="light-content" />
        <ScrollView>
          <VaccinesTable data={data} onPressItem={onNavigateToClickedCell} />
        </ScrollView>
      </SafeAreaView>
    </FullView>
  );
};
