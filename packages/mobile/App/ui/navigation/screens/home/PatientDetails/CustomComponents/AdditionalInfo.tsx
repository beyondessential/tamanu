import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '../../../../../components/FieldRowDisplay';
import { ErrorScreen } from '../../../../../components/ErrorScreen';
import { LoadingScreen } from '../../../../../components/LoadingScreen';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '../../../../../contexts/LocalisationContext';
import {
  CustomPatientFieldValues,
  usePatientAdditionalData,
} from '~/ui/hooks/usePatientAdditionalData';
import { mapValues } from 'lodash';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { Patient } from '~/models/Patient';

interface AdditionalInfoProps {
  onEdit: (
    additionalInfo: PatientAdditionalData,
    sectionTitle: Element,
    customPatientFieldValues: CustomPatientFieldValues,
  ) => void;
  patient: Patient;
  dataSections;
}

function getPadFieldData(data: PatientAdditionalData, fieldName: string): string {
  // Field is reference data
  if (fieldName.slice(-2) === 'Id') {
    const actualName = fieldName.slice(0, -2);
    return data?.[actualName]?.name;
  }

  // Field is a string field
  return data?.[fieldName];
}

export const AdditionalInfo = ({
  patient,
  onEdit,
  dataSections,
}: AdditionalInfoProps): ReactElement => {
  const { getBool } = useLocalisation();
  const {
    customPatientSections,
    customPatientFieldValues,
    customPatientFieldDefinitions,
    patientAdditionalData,
    loading,
    error,
  } = usePatientAdditionalData(patient.id);

  const customDataById = mapValues(customPatientFieldValues, nestedObject => nestedObject[0].value);

  // Display general error
  if (error) {
    return <ErrorScreen error={error} />;
  }

  // Check if patient additional data should be editable
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  // Add edit callback and map the inner 'fields' array
  const additionalSections = dataSections.map(({ title, fields }) => {
    const onEditCallback = (): void =>
      onEdit(patientAdditionalData, title, false, null, customPatientFieldValues);

    const fieldsWithData = fields.map(field => {
      if (field === 'villageId' || field.name === 'villageId')
        return [field.name, patient.village?.name];
      else if (typeof field === 'object') {
        return [field.name, getPadFieldData(patientAdditionalData, field.name)];
      } else if (Object.keys(customDataById).includes(field)) {
        return [field, customDataById[field]];
      } else {
        return [field, getPadFieldData(patientAdditionalData, field)];
      }
    });

    return { title, fields: fieldsWithData, onEditCallback };
  });

  const customSections = customPatientSections.map(([_categoryId, fields]) => {
    const title = fields[0].category.name;
    const onEditCallback = (): void => onEdit(null, title, true, fields, customPatientFieldValues);
    const mappedFields = fields.map(field => [
      field.name,
      customPatientFieldValues[field.id]?.[0]?.value,
    ]);
    return { title, fields: mappedFields, onEditCallback, isCustomSection: true };
  });

  const sections = [...(additionalSections || []), ...(customSections || [])];

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
