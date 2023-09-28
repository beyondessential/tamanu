import React, { ReactElement, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { compose } from 'redux';

import { formatStringDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { getGender } from '~/ui/helpers/user';
import { IPatient } from '~/types';
import { withPatient } from '~/ui/containers/Patient';
import { Patient } from '~/models/Patient';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { ErrorScreen } from '~/ui/components/ErrorScreen';

interface GeneralInfoProps {
  onEdit: () => void;
  setSelectedPatient: (patient: IPatient) => void;
  patient: IPatient;
}

const DumbGeneralInfo = ({
  onEdit,
  patient,
  setSelectedPatient,
}: GeneralInfoProps): ReactElement => {
  const fields = [
    ['firstName', patient.firstName],
    ['middleName', patient.middleName || 'None'],
    ['lastName', patient.lastName],
    ['culturalName', patient.culturalName || 'None'],
    ['sex', getGender(patient.sex)],
    ['dateOfBirth', formatStringDate(patient.dateOfBirth, DateFormats.DDMMYY)],
    ['email', patient.email],
    ['villageId', patient.village?.name ?? ''],
  ];
  const [error, setError] = useState<Error | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  // Reload patient when general info is focused
  useFocusEffect(
    useCallback(async () => {
      try {
        setIsLoading(true);
        const reloadedPatient = await Patient.findOne(patient.id);
        setSelectedPatient(reloadedPatient);
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }, [patient.id]),
  );

  // Check if patient information should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <PatientSection
      title="General Information"
      onEdit={isEditable ? onEdit : undefined}
    >
      <FieldRowDisplay fields={fields} />
    </PatientSection>
  );
};

export const GeneralInfo = compose(withPatient)(DumbGeneralInfo);
