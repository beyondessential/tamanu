import React, { ReactElement } from 'react';

import { formatStringDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PATIENT_DATA_FIELDS } from '~/ui/helpers/patient';
import { PatientSection } from '../../CustomComponents/PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { getGender } from '~/ui/helpers/user';
import { IPatient } from '~/types';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { mapValues } from 'lodash';
import { CAMBODIA_CUSTOM_FIELDS } from './fields';

interface GeneralInfoProps {
  onEdit: () => void;
  patient: IPatient;
}

export const GeneralInfo = ({ onEdit, patient }: GeneralInfoProps): ReactElement => {
  // Check if patient information should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  const {
    customPatientFieldDefinitions,
    customPatientFieldValues,
    loading,
  } = usePatientAdditionalData(patient.id);

  const customDataById = mapValues(customPatientFieldValues, nestedObject => nestedObject[0].value);

  const fields = [
    [PATIENT_DATA_FIELDS.LAST_NAME, patient.lastName],
    [PATIENT_DATA_FIELDS.FIRST_NAME, patient.firstName],
    [PATIENT_DATA_FIELDS.DATE_OF_BIRTH, formatStringDate(patient.dateOfBirth, DateFormats.DDMMYY)],
    [PATIENT_DATA_FIELDS.SEX, getGender(patient.sex)],
    [PATIENT_DATA_FIELDS.CULTURAL_NAME, patient.culturalName],
    [
      CAMBODIA_CUSTOM_FIELDS.FATHERS_FIRST_NAME,
      customDataById[CAMBODIA_CUSTOM_FIELDS.FATHERS_FIRST_NAME],
    ],
  ];

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
        <FieldRowDisplay
          fields={[...fields]}
          customFieldDefinitions={customPatientFieldDefinitions}
        />
      )}
    </PatientSection>
  );
};
