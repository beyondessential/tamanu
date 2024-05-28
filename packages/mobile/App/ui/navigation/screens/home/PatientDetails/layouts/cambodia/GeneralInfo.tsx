import React, { ReactElement } from 'react';

import { formatStringDate } from '/helpers/date';
import { DateFormats } from '/helpers/constants';
import { FieldRowDisplay } from '~/ui/components/FieldRowDisplay';
import { PatientSection } from '../../CustomComponents/PatientSection';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { getGender } from '~/ui/helpers/user';
import { IPatient } from '~/types';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';
import { LoadingScreen } from '~/ui/components/LoadingScreen';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { mapValues } from 'lodash';

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
    ['lastName', patient.lastName],
    ['firstName', patient.firstName],
    ['dateOfBirth', formatStringDate(patient.dateOfBirth, DateFormats.DDMMYY)],
    ['sex', getGender(patient.sex)],
    ['culturalName', patient.culturalName],
    ['fieldDefinition-fathersFirstName', customDataById['fieldDefinition-fathersFirstName']],
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
