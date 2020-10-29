import { useState, useEffect, useContext } from 'react';
import { BackendContext } from '~/services/backendProvider';
import { readConfig } from '~/services/config';
import { IPatient } from '~/types';

export const useCancelableEffect = (fetcher, dependencies = []): [any, Error | null] => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let canceled = false;
    (async (): Promise<void> => {
      try {
        const result = await fetcher();
        if (!canceled) {
          setData(result);
        }
      } catch (e) {
        setError(e);
      }
    })();
    return (): void => {
      canceled = true;
    };
  }, dependencies);

  return [data, error];
};

export const useBackendEffect = (call, dependencies = []): [any, Error | null] => {
  const backend = useContext(BackendContext);

  return useCancelableEffect(() => call(backend), dependencies);
};

export const useBackend = (): any => useContext(BackendContext);

export const useRecentlyViewedPatients = (): [IPatient[] | null, Error | null] => useBackendEffect(
  async ({ models }): Promise<string[]> => {
    const patientIds: string[] = JSON.parse(await readConfig('recentlyViewedPatients', '[]'));
    if (patientIds.length === 0) return [];

    const list = await models.Patient.getRepository().findByIds(patientIds);

    // Map is needed to make sure that patients are in the same order as in recentlyViewedPatients
    // (typeorm findByIds doesn't guarantee return order)
    return patientIds.map(storedId => list.find(({ id }) => id === storedId));
  },
);
