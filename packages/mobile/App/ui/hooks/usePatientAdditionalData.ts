import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { groupBy } from 'lodash';
import { useBackend } from '.';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { PatientFieldValue } from '~/models/PatientFieldValue';
import { PatientAdditionalData } from '~/models/PatientAdditionalData';

export type CustomPatientFieldValues = {
  [key: string]: PatientFieldValue[];
};

export const usePatientAdditionalData = patientId => {
  const backend = useBackend();
  const [customPatientSections, setCustomPatientSections] = useState([]);
  const [customPatientFieldDefinitions, setCustomPatientFieldDefinitions] = useState<
    PatientFieldDefinition[]
  >([]);
  const [customPatientFieldValues, setCustomPatientFieldValues] = useState<
    CustomPatientFieldValues
  >({});
  const [patientAdditionalData, setPatientAdditionalData] = useState<PatientAdditionalData>(null);
  const [error, setError] = useState<Error>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async (): Promise<void> => {
        const { models } = backend;
        try {
          if (patientId) {
            const [record, fieldDefinitions, fieldValues] = await Promise.all([
              models.PatientAdditionalData.find({
                where: { patient: { id: patientId } },
              }),
              models.PatientFieldDefinition.findVisible({
                relations: ['category'],
                order: {
                  // Nested ordering only works with typeorm version > 0.3.0
                  // category: { name: 'DESC' },
                  name: 'DESC',
                },
              }),
              models.PatientFieldValue.find({
                where: { patient: { id: patientId } },
              }),
            ]);
            const padData = record && record[0];
            if (!mounted) {
              return;
            }
            // Since nested ordering does not  work on typeorm version < 0.3.0
            // we sort the categories on the frontend using .sort()
            setCustomPatientSections(
              Object.entries(
                groupBy(
                  fieldDefinitions.sort((a, b) => a.category?.name.localeCompare(b.category?.name)),
                  'categoryId',
                ),
              ),
            );
            setCustomPatientFieldDefinitions(fieldDefinitions);
            setCustomPatientFieldValues(groupBy(fieldValues, 'definitionId'));
            setPatientAdditionalData(padData);
          }
        } catch (err) {
          if (!mounted) {
            return;
          }
          setError(err);
        } finally {
          setLoading(false);
        }
      })();
      return (): void => {
        mounted = false;
      };
    }, [backend, patientId]),
  );

  return {
    customPatientSections,
    customPatientFieldDefinitions,
    customPatientFieldValues,
    patientAdditionalData,
    loading,
    error,
  };
};
