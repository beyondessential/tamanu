import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from './CustomComponents/PatientSection';
import { getGender } from '~/ui/helpers/user';
import { IPatient } from '~/types';
import { ALL_ADDITIONAL_DATA_FIELDS } from '/helpers/additionalData';
import { getFieldData, PATIENT_DATA_FIELDS } from '~/ui/helpers/patient';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';
import { ErrorScreen } from '../../../../components/ErrorScreen';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';

interface GeneralInfoProps {
  onEdit: () => void;
  patient: IPatient;
}

export const GeneralInfo = ({ onEdit, patient }: GeneralInfoProps): ReactElement => {
  const { formatShort } = useDateTimeFormat();

  const fields = [
    [PATIENT_DATA_FIELDS.FIRST_NAME, patient.firstName],
    [PATIENT_DATA_FIELDS.MIDDLE_NAME, patient.middleName || 'None'],
    [PATIENT_DATA_FIELDS.LAST_NAME, patient.lastName],
    [PATIENT_DATA_FIELDS.CULTURAL_NAME, patient.culturalName || 'None'],
    [PATIENT_DATA_FIELDS.SEX, getGender(patient.sex)],
    [PATIENT_DATA_FIELDS.DATE_OF_BIRTH, formatShort(patient.dateOfBirth)],
    [PATIENT_DATA_FIELDS.EMAIL, patient.email],
    [
      PATIENT_DATA_FIELDS.VILLAGE_ID,
      <TranslatedReferenceData
        fallback={patient.village?.name ?? ''}
        value={patient.village?.id}
        category="village"
      />,
    ],
  ];

  // Check if patient information should be editable
  const { getSetting } = useSettings();
  const isEditable = getSetting<boolean>('features.editPatientDetailsOnMobile');

  const { patientAdditionalData, loading, error } = usePatientAdditionalData(patient.id);

  const patientAdditionalDataFields = ALL_ADDITIONAL_DATA_FIELDS.filter((fieldName) =>
    getSetting<boolean>(`fields.${fieldName}.requiredPatientData`),
  ).map((fieldName) => [fieldName, getFieldData(patientAdditionalData, fieldName)]);
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
