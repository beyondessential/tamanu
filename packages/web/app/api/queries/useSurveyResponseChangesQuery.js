/**
 * @typedef {import('@tamanu/database').ChangeLog} ChangeLog
 * @typedef {import('@tamanu/database').SurveyResponse} SurveyResponse
 * @typedef {import('@tamanu/database').User} User
 * @typedef {{
 *   id: ChangeLog['id'];
 *   loggedAt: ChangeLog['loggedAt'];
 *   tableName: 'survey_responses' | 'survey_response_answers';
 *   recordId: ChangeLog['recordId'];
 *   recordData: SurveyResponse;
 *   updatedByUser: { id: ChangeLog['updatedByUserId']; displayName: User['displayName'] };
 * }} Change
 */

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

/**
 * @param {import('@tamanu/database').SurveyResponse['id']} surveyResponseId
 * @param {import('@tanstack/react-query').UseQueryOptions<Change[]>} options
 * @returns {import('@tanstack/react-query').UseQueryResult<Change[]>}
 */
export const useSurveyResponseChangesQuery = (surveyResponseId, options = {}) => {
  const { enabled = true } = options;
  const api = useApi();
  return useQuery({
    ...options,
    queryKey: ['surveyResponseChanges', surveyResponseId],
    queryFn: async () =>
      await api.get(`surveyResponse/${encodeURIComponent(surveyResponseId)}/changes`),
    enabled: enabled && Boolean(surveyResponseId),
  });
};
