import React, { ReactElement, useEffect } from 'react';
import { Platform } from 'react-native';
import { compose } from 'redux';
import { NavigationProp } from '@react-navigation/native';
import { TouchableOpacity, FlatList } from 'react-native-gesture-handler';
// Containers
import { withPatient } from '/containers/Patient';
// Components
import { PatientTile } from '/components/PatientTile';
import { LoadingScreen } from '/components/LoadingScreen';
import { ErrorScreen } from '/components/ErrorScreen';
// props
import { RecentViewedScreenProps } from '/interfaces/screens/PatientSearchStack';
// Helpers
import { Routes } from '/helpers/routes';
import { StyledView, FullView } from '/styled/common';
import { joinNames } from '/helpers/user';
import { getAgeFromDate } from '~/ui/helpers/date';
import { useRecentlyViewedPatients } from '~/ui/hooks/localConfig';
import { navigateAfterTimeout } from '~/ui/helpers/navigators';

interface PatientListProps {
  list: any[];
  setSelectedPatient: Function;
  navigation: NavigationProp<any>;
}

const Screen = ({
  navigation,
  setSelectedPatient,
}: RecentViewedScreenProps): ReactElement => {
  const [recentlyViewedPatients, error] = useRecentlyViewedPatients();

  useEffect(() => {
    if (!recentlyViewedPatients) return;
    if (recentlyViewedPatients.length === 0) {
      navigateAfterTimeout(
        navigation,
        Routes.HomeStack.SearchPatientStack.SearchPatientTabs.ViewAll,
      );
    }
  }, [recentlyViewedPatients]);

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!recentlyViewedPatients || !recentlyViewedPatients.length) {
    return <LoadingScreen text="Loading patients..." />;
  }

  return (
    <FullView>
      <FlatList
        showsVerticalScrollIndicator={Platform.OS === 'android'}
        data={recentlyViewedPatients}
        keyExtractor={(item): string => item.id.toString()}
        renderItem={({ item }: { item: any }): ReactElement => {
          const onNavigateToPatientHome = (): void => {
            setSelectedPatient(item);
            navigation.navigate(Routes.HomeStack.HomeTabs.Index, {
              screen: Routes.HomeStack.HomeTabs.Home,
            });
          };
          return (
            <TouchableOpacity onPress={onNavigateToPatientHome}>
              <PatientTile
                {...item}
                name={joinNames(item)}
                age={getAgeFromDate(item.dateOfBirth)}
              />
            </TouchableOpacity>
          );
        }}
      />
      <StyledView
        position="absolute"
        zIndex={2}
        width="100%"
        alignItems="center"
        bottom={30}
      />
    </FullView>
  );
};

export const RecentViewedScreen = compose(withPatient)(Screen);
