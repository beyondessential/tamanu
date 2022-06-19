import { useBackendEffect } from '.';

export const useRecentlyViewedPatients = () => useBackendEffect(
  async ({ models }) => models.Patient.findRecentlyViewed(),
);
