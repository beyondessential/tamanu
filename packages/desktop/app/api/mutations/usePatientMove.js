import { useMutation } from '@tanstack/react-query';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { useApi } from '../useApi';
import { usePatientNavigation } from '../../utils/usePatientNavigation';

export const usePatientMove = (encounterId, onClose) => {
  const { put } = useApi();
  const { navigateToEncounter } = usePatientNavigation();

  return useMutation(
    ({ plannedLocationId, locationId }) =>
      put(`encounter/${encounterId}`, {
        data: {
          plannedLocationId,
          locationId,
          submittedTime: getCurrentDateTimeString(),
        },
      }),
    {
      onSuccess: () => {
        console.log('success');
        navigateToEncounter(encounterId);
        onClose();
      },
    },
  );
};
