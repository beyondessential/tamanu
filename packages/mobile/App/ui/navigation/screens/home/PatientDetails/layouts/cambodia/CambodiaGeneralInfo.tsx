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

const FIELD_DEFINITION_IDS = {
  FATHERS_FIRST_NAME: 'fieldDefinition-fathersFirstName',
  MOTHERS_FIRST_NAME: 'fieldDefinition-mothersFirstName',
};

const getCustomFieldValue = (customPatientFieldValues = {}, fieldDefinitionId) => {
  return customPatientFieldValues[fieldDefinitionId][0].value;
};

export const CambodiaGeneralInfo = ({ onEdit, patient }: GeneralInfoProps): ReactElement => {
  // Check if patient information should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  const {
    patientAdditionalData,
    customPatientFieldValues,
    loading,
    error,
  } = usePatientAdditionalData(patient.id);

  const fields = [
    ['lastName', patient.lastName],
    ['firstName', patient.firstName],
    ['dateOfBirth', formatStringDate(patient.dateOfBirth, DateFormats.DDMMYY)],
    ['sex', getGender(patient.sex)],
    [
      'fathersFirstName',
      !loading ? getCustomFieldValue(customPatientFieldValues, FIELD_DEFINITION_IDS.FATHERS_FIRST_NAME) : '',
    ],
    ['mothersFirstName', patient.culturalName],
  ];

  const patientAdditionalDataFields = allAdditionalDataFields
    .filter(fieldName => getBool(`fields.${fieldName}.requiredPatientData`))
    .map(fieldName => [fieldName, getFieldData(patientAdditionalData, fieldName)]);
  if (error) {
    return <ErrorScreen error={error} />;
  }

  return (
    <PatientSection
      title={
        <TranslatedText
          stringId="patient.details.subheading.generalInformation"
          fallback="CAMBODIA - General Information"
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
