import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useBackend } from '.';

export const usePatientAdditionalData = patientId => {
  const backend = useBackend();
  const [patientAdditionalData, setPatientAdditionalData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async (): Promise<void> => {
        const { models } = backend;
        try {
          if (!patientId) {
            const record = await models.PatientAdditionalData.find({
              where: { patient: { id: patientId } },
            });
            const result = record && record[0];
            if (!mounted) {
              return;
            }
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

  return { patientAdditionalData, loading, error };
};
