import React, { type ReactElement, useEffect } from 'react';
import { Platform } from 'react-native';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { compose } from 'redux';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { PatientFromRoute } from '~/ui/helpers/constants';
import { getAgeFromDate } from '~/ui/helpers/date';
import { navigateAfterTimeout } from '~/ui/helpers/navigators';
import useRecentlyViewedPatients from '~/ui/hooks/useRecentlyViewedPatients';
import { theme } from '~/ui/styled/theme';
import { ErrorScreen } from '/components/ErrorScreen';
import { LoadingScreen } from '/components/LoadingScreen';
import { PatientTile } from '/components/PatientTile';
import { withPatient } from '/containers/Patient';
import { Routes } from '/helpers/routes';
import { joinNames } from '/helpers/user';
import type { RecentViewedScreenProps } from '/interfaces/Screens/PatientSearchStack/RecentViewedScreenProps';
import { FullView, StyledText, StyledView } from '/styled/common';

const NoPatientsCard = (): ReactElement => (
  <StyledText
    color={theme.colors.TEXT_SUPER_DARK}
    fontWeight={'500'}
    marginLeft="auto"
    marginRight="auto"
    marginTop={50}
    marginBottom={0}
    fontSize={14}
  >
    <TranslatedText
      stringId="patient.search.recentlyViewed.message.noPatientsFound"
      fallback="No recently viewed patients to display."
    />
  </StyledText>
);

const Screen = ({ navigation, setSelectedPatient }: RecentViewedScreenProps): ReactElement => {
  const { data: recentlyViewedPatients, error } = useRecentlyViewedPatients();

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

  if (!recentlyViewedPatients) {
    return <LoadingScreen />;
  }

  if (recentlyViewedPatients.length === 0) {
    return <NoPatientsCard />;
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
            navigation.navigate(Routes.HomeStack.SearchPatientStack.Index, {
              screen: Routes.HomeStack.SearchPatientStack.Index,
              from: PatientFromRoute.RECENTLY_VIEWED,
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
      <StyledView position="absolute" zIndex={2} width="100%" alignItems="center" bottom={30} />
    </FullView>
  );
};

export const RecentViewedScreen = compose(withPatient)(Screen);
