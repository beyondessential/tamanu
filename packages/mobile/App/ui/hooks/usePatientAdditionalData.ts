import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { groupBy } from 'lodash';

import { useBackend } from '.';

export const usePatientAdditionalData = patientId => {
  const backend = useBackend();
  const [customPatientSections, setCustomPatientSections] = useState([]);
  const [customPatientFieldValues, setCustomPatientFieldValues] = useState([]);
  const [patientAdditionalData, setPatientAdditionalData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
                relations: [ 'category' ],
              }),
              models.PatientFieldValue.find({
                where: { patient: { id: patientId } },
              }),
            ]);
            const result = record && record[0];
            if (!mounted) {
              return;
            }
            setCustomPatientSections(Object.entries(groupBy(fieldDefinitions, 'categoryId')));
            setCustomPatientFieldValues(groupBy(fieldValues, 'definitionId'));
            setPatientAdditionalData(result);
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
    customPatientFieldValues,
    patientAdditionalData,
    loading,
    error
  };
};
