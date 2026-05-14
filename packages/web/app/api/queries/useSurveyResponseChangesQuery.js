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
 *   programDataElement: Pick<ProgramDataElement, 'id' | 'name' | 'type'> | null;
 *   updatedByUser: Pick<User, 'id' | 'displayName'>;
 * }} Change
 */

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

/**
 * @param {import('@tamanu/database').SurveyResponse['id']} surveyResponseId
 * @param {Omit<
 *   import('@tanstack/react-query').UseQueryOptions<Change[]>, 'queryKey' | 'queryFn'
 * >} options
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
