import { useMutation } from '@tanstack/react-query';
import React from 'react';

import { TranslatedText, VISIBILITY_STATUS_TRANSLATIONS } from '@tamanu/ui-components';
import { useApi } from '../../../../api';
import { notifyError, notifySuccess } from '../../../../utils';

/**
 * @param {Omit<import('@tanstack/react-query').UseMutationOptions, 'mutationFn' | 'mutationKey'>} [useMutationOptions]
 */
export function useVisibilityStatusMutation(useMutationOptions = {}) {
  const { onSuccess, onError, ...rest } = useMutationOptions;

  const api = useApi();

  return useMutation({
    ...rest,
    mutationKey: ['admin', 'programRegistrySubResource', 'visibilityStatus'],
    mutationFn: async ({ recordId, resourceSegment, visibilityStatus }) =>
      await api.patch(`admin/${resourceSegment}/${encodeURIComponent(recordId)}`, {
        visibilityStatus,
      }),
    onSuccess: (data, variables, context) => {
      notifySuccess(
        <TranslatedText
          stringId="admin.programRegistries.table.visibilityUpdateSuccess"
          fallback="Visibility status updated to :visibilityStatus"
          replacements={{ visibilityStatus: VISIBILITY_STATUS_TRANSLATIONS[data.visibilityStatus] }}
        />,
      );
      onSuccess?.(data, variables, context);
    },
    onError: (err, variables, context) => {
      notifyError(err?.message);
      onError?.(err, variables, context);
    },
  });
}
