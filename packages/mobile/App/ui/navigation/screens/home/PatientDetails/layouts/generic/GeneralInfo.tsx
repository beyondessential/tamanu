import React, { ReactElement } from 'react';

import { formatStringDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from '../../CustomComponents/PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { getGender } from '~/ui/helpers/user';
import { IPatient } from '~/types';
import { ALL_ADDITIONAL_DATA_FIELDS } from '/helpers/additionalData';
import { PATIENT_DATA_FIELDS, getFieldData } from '~/ui/helpers/patient';
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
    [PATIENT_DATA_FIELDS.FIRST_NAME, patient.firstName],
    [PATIENT_DATA_FIELDS.MIDDLE_NAME, patient.middleName || 'None'],
    [PATIENT_DATA_FIELDS.LAST_NAME, patient.lastName],
    [PATIENT_DATA_FIELDS.CULTURAL_NAME, patient.culturalName || 'None'],
    [PATIENT_DATA_FIELDS.SEX, getGender(patient.sex)],
    [PATIENT_DATA_FIELDS.DATE_OF_BIRTH, formatStringDate(patient.dateOfBirth, DateFormats.DDMMYY)],
    [PATIENT_DATA_FIELDS.EMAIL, patient.email],
    [PATIENT_DATA_FIELDS.VILLAGE_ID, patient.village?.name ?? ''],
  ];

  // Check if patient information should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  const { patientAdditionalData, loading, error } = usePatientAdditionalData(patient.id);

  const patientAdditionalDataFields = ALL_ADDITIONAL_DATA_FIELDS.filter(fieldName =>
    getBool(`fields.${fieldName}.requiredPatientData`),
  ).map(fieldName => [fieldName, getFieldData(patientAdditionalData, fieldName)]);
  if (error) {
    return <ErrorScreen error={error} />;
  }

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
