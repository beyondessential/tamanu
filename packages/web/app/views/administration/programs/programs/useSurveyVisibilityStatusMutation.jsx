import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { TranslatedText, VISIBILITY_STATUS_TRANSLATIONS } from '@tamanu/ui-components';
import { useApi } from '../../../../api';
import { notifyError, notifySuccess } from '../../../../utils';

export function useSurveyVisibilityStatusMutation(surveyId) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['survey', surveyId],
    mutationFn: async ({ visibilityStatus }) =>
      await api.put(`admin/survey/${encodeURIComponent(surveyId)}`, { visibilityStatus }),
    onSuccess: async ({ visibilityStatus }) => {
      notifySuccess(
        <TranslatedText
          stringId="admin.programs.surveys.table.visibilityUpdateSuccess"
          fallback="Visibility status updated to :visibilityStatus"
          replacements={{ visibilityStatus: VISIBILITY_STATUS_TRANSLATIONS[visibilityStatus] }}
        />,
      );
      await queryClient.invalidateQueries({ queryKey: ['survey'] });
    },
    onError: err => {
      notifyError(err?.message);
    },
  });
}
