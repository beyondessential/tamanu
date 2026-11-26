import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';

import { getAnswersFromData, useDateTime } from '@tamanu/ui-components';
import { useApi } from '../api';
import { ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY } from '../api/queries/useEncounterSyndromicSurveillanceQuery';
import { useAuth } from '../contexts/Auth';

/**
 * Submits the encounter's response to the syndromic surveillance form, from the diagnosis pane or,
 * under the permission to discharge, from the discharge form.
 *
 * spec: SYND#completion
 */
export const useSubmitSyndromicSurveillance = ({ encounterId, patientId, isDischarging }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId } = useAuth();
  const { getCurrentDateTime } = useDateTime();
  const [startTime] = useState(getCurrentDateTime);

  return async (survey, formValues) => {
    const submissionRoute = isDischarging
      ? route('encounter/:encounterId/syndromicSurveillance/dischargeSurveyResponse', {
          encounterId,
        })
      : route('encounter/:encounterId/syndromicSurveillance/surveyResponse', { encounterId });
    try {
      await api.post(submissionRoute, {
        facilityId,
        startTime,
        endTime: getCurrentDateTime(),
        answers: await getAnswersFromData(formValues, survey),
      });
      queryClient.invalidateQueries(['patientDetails', patientId]);
    } finally {
      // Refreshed on failure too: a submission is rejected once the encounter has a response, such
      // as one a colleague has just submitted, and it then shows as complete rather than offering a
      // form that can no longer be submitted.
      await queryClient.invalidateQueries([
        ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY,
        encounterId,
      ]);
    }
  };
};
