import React, { useState, ReactElement } from 'react';
import { StyleSheet, Platform } from 'react-native';
import { compose } from 'redux';
import { useField } from 'formik';
import { NavigationProp } from '@react-navigation/native';
import { TouchableOpacity, FlatList } from 'react-native-gesture-handler';
// Containers
import { withPatient } from '../../../containers/Patient';
// Components
import { PatientTile } from '../../../components/PatientTile';
// props
import { RecentViewedScreenProps } from '../../../interfaces/screens/PatientSearchStack';
// Helpers
import { data } from '../../../components/PatientSectionList/fixture';
import { Routes } from '../../../helpers/constants';

const mockedArray = data.slice(0, 12);

interface PatientListProps {
  list: any[],
  setSelectedPatient: Function
  navigation: NavigationProp<any>
}


const Screen = ({
  navigation,
  setSelectedPatient,
}: RecentViewedScreenProps): ReactElement => {
  /** Get Search Input */
  const [field] = useField('search');
  const [recentlyViewedArray, setRecentlyViewedArray] = useState(mockedArray);
  const list = recentlyViewedArray.filter(patientData => patientData.name.startsWith(field.value));

  return (
    <FlatList
      showsVerticalScrollIndicator={Platform.OS === 'android'}
      data={list}
      keyExtractor={(item): string => item.id.toString()}
      renderItem={({ item }): ReactElement => {
        const onNavigateToPatientHome = (): void => {
          setSelectedPatient(item);
          navigation.navigate(Routes.HomeStack.HomeTabs.Home);
        };
        return (
          <TouchableOpacity onPress={onNavigateToPatientHome}>
            <PatientTile {...item} />
          </TouchableOpacity>
        );
      }}
    />
  );
};

export const RecentViewedScreen = compose(withPatient)(Screen);
