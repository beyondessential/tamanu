import { useMemo } from 'react';

/**
 * What the survey form needs to edit an existing response: the survey as the response answered it,
 * the answers to prefill, and which questions have been edited before.
 */
export const useSurveyResponseEditValues = surveyResponse => {
  const surveyForEdit = useMemo(() => {
    if (!surveyResponse) return null;
    return {
      id: surveyResponse.surveyId,
      name: surveyResponse.surveyName,
      components: surveyResponse.components,
    };
  }, [surveyResponse]);

  const initialAnswerOverrides = useMemo(() => {
    if (!surveyResponse?.answers?.length) return null;
    return Object.fromEntries(
      surveyResponse.answers.map(a => {
        const value = a.originalBody ?? a.body;
        return [a.dataElementId, value];
      }),
    );
  }, [surveyResponse]);

  const editedDataElementIds = useMemo(() => {
    const ids = new Set();
    for (const answer of surveyResponse?.answers ?? []) {
      if (answer.editedTime) ids.add(answer.dataElementId);
    }
    return ids;
  }, [surveyResponse]);

  return { surveyForEdit, initialAnswerOverrides, editedDataElementIds };
};
