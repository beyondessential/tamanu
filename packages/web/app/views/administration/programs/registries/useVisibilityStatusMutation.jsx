import { useMutation } from '@tanstack/react-query';
import React from 'react';

import { TranslatedText, VISIBILITY_STATUS_TRANSLATIONS } from '@tamanu/ui-components';
import { useApi } from '../../../../api';
import { notifyError, notifySuccess } from '../../../../utils';

export function useVisibilityStatusMutation() {
  const api = useApi();

  return useMutation({
    mutationKey: ['admin', 'programRegistrySubResource', 'visibilityStatus'],
    mutationFn: ({ recordId, resourceSegment, visibilityStatus }) =>
      api.put(`admin/${resourceSegment}/${encodeURIComponent(recordId)}`, {
        visibilityStatus,
      }),
    onSuccess: ({ visibilityStatus }) => {
      notifySuccess(
        <TranslatedText
          stringId="admin.programRegistries.table.visibilityUpdateSuccess"
          fallback="Visibility status updated to :visibilityStatus"
          replacements={{ visibilityStatus: VISIBILITY_STATUS_TRANSLATIONS[visibilityStatus] }}
        />,
      );
    },
    onError: err => {
      notifyError(err?.message);
    },
  });
}
