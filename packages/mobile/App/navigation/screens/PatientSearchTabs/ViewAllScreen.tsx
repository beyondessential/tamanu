import React, { ReactElement, useCallback, FC } from 'react';
import { useField } from 'formik';
import { compose } from 'redux';
// Containers
import { withPatient } from '../../../containers/Patient';
// Components
import { FullView } from '../../../styled/common';
import { PatientSectionList } from '../../../components/PatientSectionList';
// Helpers
import { data } from '../../../components/PatientSectionList/fixture';
import { groupEntriesByLetter } from '../../../helpers/list';
import { Routes } from '../../../helpers/constants';
//Props
import { ViewAllScreenProps } from '../../../interfaces/screens/PatientSearchStack';


const Screen: FC<ViewAllScreenProps> = (
  {
    navigation,
    setSelectedPatient,
  }: ViewAllScreenProps,
): ReactElement => {
  /** Get Search Input */
  const [field] = useField('search');
  // Sort data
  const list = data.filter((patientData) => patientData.name.startsWith(field.value));
  const sortedData = groupEntriesByLetter(list);

  const onNavigateToPatientHome = useCallback(
    (patient) => {
      setSelectedPatient(patient);
      navigation.navigate(Routes.HomeStack.name);
    },
    [],
  );

  return (
    <FullView>
      <PatientSectionList
        data={sortedData}
        onPressItem={onNavigateToPatientHome}
      />
    </FullView>
  );
};

export const ViewAllScreen = compose(withPatient)(Screen);
