import { useMutation } from '@tanstack/react-query';
import React from 'react';

import { TranslatedText } from '@tamanu/ui-components';
import { useApi } from '../../../../api';
import { notifyError, notifySuccess } from '../../../../utils';

export function useSurveyVisibilityStatusMutation(surveyId) {
  const api = useApi();

  return useMutation({
    mutationKey: ['survey', surveyId],
    mutationFn: async ({ visibilityStatus }) =>
      await api.put(`admin/survey/${encodeURIComponent(surveyId)}`, { visibilityStatus }),
    onSuccess: () => {
      notifySuccess(
        <TranslatedText
          stringId="admin.programs.surveys.table.visibilityUpdateSuccess"
          fallback="Visibility status updated"
        />,
      );
    },
    onError: err => {
      notifyError(err?.message);
    },
  });
}
