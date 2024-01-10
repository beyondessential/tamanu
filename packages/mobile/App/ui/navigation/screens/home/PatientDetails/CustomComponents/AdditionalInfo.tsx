import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '../../../../../components/FieldRowDisplay';
import { ErrorScreen } from '../../../../../components/ErrorScreen';
import { LoadingScreen } from '../../../../../components/LoadingScreen';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '../../../../../contexts/LocalisationContext';
import { IPatient, IPatientAdditionalData } from '../../../../../../types';
import { additionalDataSections } from '../../../../../helpers/additionalData';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';

interface AdditionalInfoProps {
  onEdit: (additionalInfo: IPatientAdditionalData, sectionTitle: string) => void;
  patient: IPatient;
}

function getFieldData(data: IPatientAdditionalData, fieldName: string): string {
  // Field is reference data
  if (fieldName.slice(-2) === 'Id') {
    const actualName = fieldName.slice(0, -2);
    return data?.[actualName]?.name;
  }

  // Field is a string field
  return data?.[fieldName];
}

export const AdditionalInfo = ({ patient, onEdit }: AdditionalInfoProps): ReactElement => {
  const {
    customPatientSections,
    customPatientFieldValues,
    patientAdditionalData,
    loading,
    error
  } = usePatientAdditionalData(patient.id);
  // Display general error
  if (error) {
    return <ErrorScreen error={error} />;
  }

  // Check if patient additional data should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  // Add edit callback and map the inner 'fields' array
  const additionalSections = additionalDataSections.map(({ title, fields }) => {
    const onEditCallback = (): void => onEdit(patientAdditionalData, title, false);
    const mappedFields = fields
      .filter(fieldName => !getBool(`fields.${fieldName}.requiredPatientData`))
      .map(fieldName => [fieldName, getFieldData(patientAdditionalData, fieldName)]);
    return { title, fields: mappedFields, onEditCallback };
  });

  const customSections = customPatientSections.map(([categoryId, fields]) => {
    const title = fields[0].category.name;
    const onEditCallback = (): void => onEdit(null, title, true, fields, customPatientFieldValues);
    const mappedFields = fields.map(field => ([field.name, customPatientFieldValues[field.id]?.[0]?.value]));
    return { title, fields: mappedFields, onEditCallback, isCustomFields: true };
  });

  const sections = [
    ...(additionalSections || []),
    ...(customSections || []),
  ];

  return (
    <>
      {sections.map(({ title, fields, onEditCallback, isCustomFields }) => (
        <PatientSection
          key={title}
          title={title}
          onEdit={isEditable ? onEditCallback : undefined}
          isClosable
        >
          {loading ? <LoadingScreen /> : <FieldRowDisplay fields={fields} isCustomFields={isCustomFields} />}
        </PatientSection>
      ))}
    </>
  );
};
