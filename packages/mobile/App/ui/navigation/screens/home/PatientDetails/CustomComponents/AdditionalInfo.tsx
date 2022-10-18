import React, { ReactElement, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { FieldRowDisplay } from '../../../../../components/FieldRowDisplay';
import { ErrorScreen } from '../../../../../components/ErrorScreen';
import { LoadingScreen } from '../../../../../components/LoadingScreen';
import { PatientSection } from './PatientSection';
import { useLocalisation } from '../../../../../contexts/LocalisationContext';
import { IPatient, IPatientAdditionalData } from '../../../../../../types';
import { useBackend } from '../../../../../hooks';
import { additionalDataSections } from '../../../../../helpers/additionalData';

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
  const backend = useBackend();
  const [additionalDataRecord, setAdditionalDataRecord] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async (): Promise<void> => {
        const { models } = backend;
        try {
          const record = await models.PatientAdditionalData.find({
            where: { patient: { id: patient.id } },
          });
          const result = record && record[0];
          if (!mounted) {
            return;
          }
          setAdditionalDataRecord(result);
          setLoading(false);
        } catch (err) {
          if (!mounted) {
            return;
          }
          setError(err);
          setLoading(false);
        }
      })();
      return (): void => {
        mounted = false;
      };
    }, [backend, patient.id]),
  );

  // Display general error
  if (error) {
    return <ErrorScreen error={error} />;
  }

  // Check if patient additional data should be editable
  const { getBool } = useLocalisation();
  const isEditable = getBool('features.editPatientDetailsOnMobile');

  // Add edit callback and map the inner 'fields' array
  const sections = additionalDataSections.map(({ title, fields }) => {
    const onEditCallback = (): void => onEdit(additionalDataRecord, title);
    const mappedFields = fields.map(fieldName => ([fieldName, getFieldData(additionalDataRecord, fieldName)]));
    return { title, fields: mappedFields, onEditCallback };
  });

  return (
    <>
      {sections.map(({ title, fields, onEditCallback }) => (
        <PatientSection
          key={title}
          title={title}
          onEdit={isEditable ? onEditCallback : undefined}
          isClosable
        >
          {loading ? <LoadingScreen /> : <FieldRowDisplay fields={fields} />}
        </PatientSection>
      ))}
    </>
  );
};
