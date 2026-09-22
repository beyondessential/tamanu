import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const PATIENT_PROFILE_PICTURE_QUERY_KEY = 'patientProfilePicture';

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
      // an attachment's contents never change, so the fetched image stays good until the photo
      // is set or removed, both of which invalidate this query
      staleTime: Infinity,
    },
  );
};
