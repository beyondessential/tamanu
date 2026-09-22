import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const PATIENT_PROFILE_PICTURE_QUERY_KEY = 'patientProfilePicture';

const PHOTO_STALE_TIME = 1000 * 60 * 5;

// A patient with no photo is answered with a 404, which is an ordinary outcome rather than a
// failure, so it resolves to no photo. Anything else is left to reject so callers can tell a
// patient without a photo apart from a photo that couldn't be loaded.
export const usePatientProfilePictureQuery = patientId => {
  const api = useApi();
  return useQuery(
    [PATIENT_PROFILE_PICTURE_QUERY_KEY, patientId],
    async () => {
      try {
        return await api.get(`patient/${encodeURIComponent(patientId)}/profilePicture`);
      } catch (error) {
        if (error?.status === 404) return null;
        throw error;
      }
    },
    {
      enabled: !!patientId,
      retry: false,
      // An attachment's contents never change, so a fetched image stays good for a while. Not
      // indefinitely though: setting and removing from the sidebar invalidate this query, but a
      // photo captured through a survey writes the same field with no hook to invalidate on, so
      // the cache has to heal on its own.
      staleTime: PHOTO_STALE_TIME,
    },
  );
};
