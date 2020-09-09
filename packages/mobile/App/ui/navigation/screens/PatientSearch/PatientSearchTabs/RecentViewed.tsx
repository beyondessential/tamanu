import React, { useState, ReactElement } from 'react';
import { Platform } from 'react-native';
import { compose } from 'redux';
import { useField } from 'formik';
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
import { data } from '/components/PatientSectionList/fixture';
import { Routes } from '/helpers/routes';
import { StyledView, FullView } from '/styled/common';
import { joinNames } from '/helpers/user';
import { getAgeFromDate } from '~/ui/helpers/date';
import { useBackendEffect } from '~/ui/helpers/hooks';

interface PatientListProps {
  list: any[];
  setSelectedPatient: Function;
  navigation: NavigationProp<any>;
}

const Screen = ({
  navigation,
  setSelectedPatient,
}: RecentViewedScreenProps): ReactElement => {
  /** Get Search Input */
  const [field] = useField('search');

  const [list, error] = useBackendEffect(({ models }) => {
    return models.Patient.getRepository().find({
      take: 10,
    });
  });

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!list) {
    return <LoadingScreen />;
  }

  return (
    <FullView>
      <FlatList
        showsVerticalScrollIndicator={Platform.OS === 'android'}
        data={list}
        keyExtractor={(item): string => item.id.toString()}
        renderItem={({ item }: { item: any }): ReactElement => {
          const onNavigateToPatientHome = (): void => {
            setSelectedPatient(item);
            navigation.navigate(Routes.HomeStack.HomeTabs.name, {
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
