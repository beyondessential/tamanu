import React, { ReactElement } from 'react';

import { formatStringDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from '../../CustomComponents/PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { getGender } from '~/ui/helpers/user';
import { IPatient } from '~/types';
import { allAdditionalDataFields } from '/helpers/additionalData';
import { getFieldData } from '~/ui/helpers/patient';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';
import { ErrorScreen } from '../../../../../../components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { TranslatedText } from '/components/Translations/TranslatedText';

interface GeneralInfoProps {
  onEdit: () => void;
  patient: IPatient;
}

export const GeneralInfo = ({ onEdit, patient }: GeneralInfoProps): ReactElement => {
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

  // Check if patient information should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  const { patientAdditionalData, loading, error } = usePatientAdditionalData(patient.id);

  const patientAdditionalDataFields = allAdditionalDataFields
    .filter(fieldName => getBool(`fields.${fieldName}.requiredPatientData`))
    .map(fieldName => [fieldName, getFieldData(patientAdditionalData, fieldName)]);
  if (error) {
    return <ErrorScreen error={error} />;
  }

  console.log('fields', fields)
  console.log('patientAdditionalDataFields', patientAdditionalDataFields)

  return (
    <PatientSection
      title={
        <TranslatedText
          stringId="patient.details.subheading.generalInformation"
          fallback="General Information"
        />
      }
      onEdit={isEditable ? onEdit : undefined}
    >
      {loading ? (
        <LoadingScreen />
      ) : (
        <FieldRowDisplay fields={[...fields, ...patientAdditionalDataFields]} />
      )}
    </PatientSection>
  );
};
