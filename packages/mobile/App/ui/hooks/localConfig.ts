import { readConfig } from '~/services/config';
import { IPatient } from '~/types';
import { useBackendEffect } from '.';

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
