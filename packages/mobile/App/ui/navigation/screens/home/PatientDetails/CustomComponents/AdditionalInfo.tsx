import React, { ReactElement } from 'react';

import { FieldRowDisplay } from '../../../../../components/FieldRowDisplay';
import { ErrorScreen } from '../../../../../components/ErrorScreen';
import { LoadingScreen } from '../../../../../components/LoadingScreen';
import { PatientSection } from './PatientSection';
import {
  CustomPatientFieldValues,
  usePatientAdditionalData,
} from '~/ui/hooks/usePatientAdditionalData';
import { mapValues } from 'lodash';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { Patient } from '~/models/Patient';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { TranslatedReferenceData } from '~/ui/components/Translations/TranslatedReferenceData';
import { ReferenceDataType } from '~/types/IReferenceData';
import { PATIENT_DATA_FIELDS } from '~/ui/helpers/patient';

interface AdditionalInfoProps {
  onEdit: (
    additionalInfo: PatientAdditionalData,
    sectionTitle: Element,
    isCustomSection: boolean,
    fields: PatientFieldDefinition[],
    customPatientFieldValues: CustomPatientFieldValues,
    sectionKey: string,
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
  const { getSetting } = useSettings();
  const {
    customPatientSections,
    customPatientFieldValues,
    customPatientFieldDefinitions,
    patientAdditionalData,
    loading,
    error,
  } = usePatientAdditionalData(patient.id);

  const customDataById = mapValues(
    customPatientFieldValues,
    (nestedObject) => nestedObject[0].value,
  );

  // Display general error
  if (error) {
    return <ErrorScreen error={error} />;
  }

  // Check if patient additional data should be editable
  const isEditable = getSetting<boolean>('features.editPatientDetailsOnMobile');

  // Add edit callback and map the inner 'fields' array
  const additionalSections = dataSections.map(
    ({ title, dataFields, fields: displayFields, sectionKey }) => {
      const fields = dataFields || displayFields;
      const onEditCallback = (): void =>
        onEdit(patientAdditionalData, title, false, null, customPatientFieldValues, sectionKey);

      const fieldsWithData = fields.map((field) => {
        if (field.name === PATIENT_DATA_FIELDS.VILLAGE_ID) {
          return [
            PATIENT_DATA_FIELDS.VILLAGE_ID,
            <TranslatedReferenceData
              key={field.name}
              category={ReferenceDataType.Village}
              fallback={patient.village?.name}
              value={patient.villageId}
            />,
          ];
        } else if (Object.keys(customDataById).includes(field)) {
          return [field, customDataById[field]];
        } else {
          return [field, getPadFieldData(patientAdditionalData, field)];
        }
      });

      return { title, fields: fieldsWithData, onEditCallback };
    },
  );

  const customSections = customPatientSections.map(([_categoryId, fields]) => {
    const title = fields[0].category.name;
    const onEditCallback = (): void =>
      onEdit(null, title, true, fields, customPatientFieldValues, null);
    const mappedFields = fields.map((field) => {
      const { id, name } = field;
      const [customFieldValue] = customPatientFieldValues[id] || [];
      return [name, customFieldValue?.value];
    });
    return { title, fields: mappedFields, onEditCallback, isCustomSection: true };
  });

  const sections = [...additionalSections, ...customSections];

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
