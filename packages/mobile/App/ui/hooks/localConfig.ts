import { readConfig } from '~/services/config';
import { IPatient } from '~/types';
import { useBackendEffect, ResultArray } from '.';

export const useRecentlyViewedPatients = (): ResultArray<IPatient[]> => useBackendEffect(
  async ({ models }): Promise<string[]> => {
    const patientIds: string[] = JSON.parse(await readConfig('recentlyViewedPatients', '[]'));
    if (patientIds.length === 0) return [];

    const list = await models.Patient.getRepository().findByIds(patientIds);

    return patientIds
      // map is needed to make sure that patients are in the same order as in recentlyViewedPatients
      // (typeorm findByIds doesn't guarantee return order)
      .map(storedId => list.find(({ id }) => id === storedId))
      // filter removes patients who couldn't be found (which occurs when a patient was deleted)
      .filter(patient => !!patient);
  },
);
