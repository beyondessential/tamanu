import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '../../../../../../components/FieldRowDisplay';
import { ErrorScreen } from '../../../../../../components/ErrorScreen';
import { LoadingScreen } from '../../../../../../components/LoadingScreen';
import { PatientSection } from '../../CustomComponents/PatientSection';
import { useLocalisation } from '../../../../../../contexts/LocalisationContext';
import { IPatient, IPatientAdditionalData } from '../../../../../../types';
import { usePatientAdditionalData } from '~/ui/hooks/usePatientAdditionalData';
import { allAdditionalDataFields } from '../../../../../../helpers/additionalData';

export const cambodiaAdditionalDataSections = [
  {
    title: 'Current address',
    fields: allAdditionalDataFields,
  },
  {
    title: 'Contact information',
    fields: [],
  },
  {
    title: 'Identification information',
    fields: ['birthCertificate'],
  },
  {
    title: 'Personal information',
    fields: [],
  },
];


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

export const CambodiaAdditionalInfo = ({ patient, onEdit }: AdditionalInfoProps): ReactElement => {
  const {
    customPatientFieldValues,
    patientAdditionalData,
    loading,
    error,
  } = usePatientAdditionalData(patient.id);
  // Display general error
  if (error) {
    return <ErrorScreen error={error} />;
  }

  // console.log('customPatientFieldValues', customPatientFieldValues)
  // console.log('patientAdditionalData', patientAdditionalData)

  // Check if patient additional data should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  // Add edit callback and map the inner 'fields' array
  const sections = cambodiaAdditionalDataSections.map(({ title, fields }) => {
    const onEditCallback = (): void => onEdit(patientAdditionalData, title, false);
    const mappedFields = fields
      .filter(fieldName => !getBool(`fields.${fieldName}.requiredPatientData`))
      .map(fieldName => [fieldName, getFieldData(patientAdditionalData, fieldName)]);
    return { title, fields: mappedFields, onEditCallback };
  });

  return (
    <>
      {sections.map(({ title, fields, onEditCallback, isCustomFields }, i) => {
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
              <FieldRowDisplay fields={fields} isCustomFields={isCustomFields} />
            )}
          </PatientSection>
        );
      })}
    </>
  );
};
