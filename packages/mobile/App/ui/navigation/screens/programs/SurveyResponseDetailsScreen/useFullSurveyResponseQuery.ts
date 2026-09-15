import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import {
  resolveAnswerDisplayRecords,
  type AnswerDisplayRecords,
} from '~/utils/resolveAnswerDisplayRecords';
import { surveyKeys } from '~/ui/hooks/queries/queryKeys';

type FullSurveyResponse = Awaited<
  ReturnType<typeof Database.models.SurveyResponse.getFullResponse>
> & {
  answerDisplayRecords: AnswerDisplayRecords;
};

/**
 * Loads a survey response along with every record its answers need to render, resolved in one
 * batch per source model rather than one query per answer.
 */
export default function useFullSurveyResponseQuery(
  surveyResponseId: string | undefined,
  useQueryOptions: Omit<UseQueryOptions<FullSurveyResponse>, 'queryKey' | 'queryFn'> = {},
) {
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery({
    queryKey: surveyKeys.fullResponse(surveyResponseId),
    queryFn: async (): Promise<FullSurveyResponse> => {
      const surveyResponse = await Database.models.SurveyResponse.getFullResponse(surveyResponseId);
      const answerDisplayRecords = await resolveAnswerDisplayRecords(
        Database.models,
        surveyResponse.answeredQuestions.map(({ question, answer }) => ({
          type: question.dataElement.type,
          config: question.config ?? null,
          answer,
        })),
      );
      return { ...surveyResponse, answerDisplayRecords };
    },
    enabled: enabled && Boolean(surveyResponseId),
    ...rest,
  });
}
