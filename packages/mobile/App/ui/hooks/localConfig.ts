import { IPatient } from '~/types';
import { useBackendEffect, ResultArray } from '.';

export const useRecentlyViewedPatients = (): ResultArray<IPatient[]> => useBackendEffect(
  async ({ models }): Promise<string[]> => models.Patient.findRecentlyViewed(),
);
