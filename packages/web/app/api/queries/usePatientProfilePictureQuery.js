import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const PATIENT_PROFILE_PICTURE_QUERY_KEY = 'patientProfilePicture';

// The image is only held on the central server, so a patient with no photo and a central server
// that can't be reached are both ordinary outcomes here: each resolves to no photo, which the
// avatar shows as the patient's initials.
export const usePatientProfilePictureQuery = patientId => {
  const api = useApi();
  return useQuery(
    [PATIENT_PROFILE_PICTURE_QUERY_KEY, patientId],
    async () => {
      try {
        return await api.get(`patient/${encodeURIComponent(patientId)}/profilePicture`);
      } catch {
        return null;
      }
    },
    {
      enabled: !!patientId,
      retry: false,
    },
  );
};
