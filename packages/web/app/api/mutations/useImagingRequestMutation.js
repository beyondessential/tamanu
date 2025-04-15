import { useMutation } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useImagingRequestMutation = (encounterId, useMutationOptions) => {
  const api = useApi();

  return useMutation(
    async (data) => api.post('imagingRequest', { ...data, encounterId }),
    useMutationOptions,
  );
};
