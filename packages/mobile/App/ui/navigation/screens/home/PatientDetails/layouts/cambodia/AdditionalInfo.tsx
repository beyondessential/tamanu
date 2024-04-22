import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '../../../../../../components/FieldRowDisplay';
import { ErrorScreen } from '../../../../../../components/ErrorScreen';
import { LoadingScreen } from '../../../../../../components/LoadingScreen';
import { PatientSection } from '../../CustomComponents/PatientSection';
import { useLocalisation } from '../../../../../../contexts/LocalisationContext';
import { IPatient, IPatientAdditionalData, IPatientFieldValue } from '../../../../../../types';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';
import { CAMBODIA_ADDITIONAL_DATA_SECTIONS } from '~/ui/helpers/additionalData';
import { isCustomField } from '~/ui/helpers/fields';

interface AdditionalInfoProps {
  onEdit: (
    additionalInfo: IPatientAdditionalData,
    sectionTitle: Element,
    customPatientFieldValues: IPatientFieldValue[],
  ) => void;
  patient: IPatient;
}

function getPadFieldData(data: IPatientAdditionalData, fieldName: string): string {
  // Field is reference data
  if (fieldName.slice(-2) === 'Id') {
    const actualName = fieldName.slice(0, -2);
    return data?.[actualName]?.name;
  }

  // Field is a string field
  return data?.[fieldName];
}

const getCustomFieldData = (customDataValues: IPatientFieldValue[], fieldName: string) => {
  if (!customDataValues[fieldName]) return '';
  return customDataValues[fieldName][0].value;
};

export const AdditionalInfo = ({ patient, onEdit }: AdditionalInfoProps): ReactElement => {
  const { getBool } = useLocalisation();
  const {
    customPatientFieldValues,
    customPatientFieldDefinitions,
    patientAdditionalData,
    loading,
    error,
  } = usePatientAdditionalData(patient.id);

  // Display general error
  if (error) {
    return <ErrorScreen error={error} />;
  }

  // Check if patient additional data should be editable
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  // Add edit callback and map the inner 'fields' array
  const sections = CAMBODIA_ADDITIONAL_DATA_SECTIONS.map(({ title, fields }) => {
    const onEditCallback = (): void =>
      onEdit(patientAdditionalData, title, customPatientFieldValues);

    const fieldsWithData = fields.map(fieldName => {

      let data = null;
      if (fieldName === 'villageId') {
        data = patient.village?.name;
      } else if (isCustomField(fieldName)) {
        data = getCustomFieldData(customPatientFieldValues, fieldName);
      } else {
        data = getPadFieldData(patientAdditionalData, fieldName);
      }

      return [fieldName, data];
    });

    return { title, fields: fieldsWithData, onEditCallback };
  });

  return (
    <>
      {sections.map(({ title, fields, onEditCallback }, i) => {
        return (
          <PatientSection
            key={'additional-info-section-' + i}
            title={title}
            onEdit={isEditable ? onEditCallback : undefined}
            isClosable
          >
            {loading ? (
              <LoadingScreen />
            ) : (
              <FieldRowDisplay
                fields={fields}
                customFieldDefinitions={customPatientFieldDefinitions}
              />
            )}
          </PatientSection>
        );
      })}
    </>
  );
};
