export const normaliseProgramDefinition = programDefinition => {
  if (!programDefinition || programDefinition.surveySheets) return programDefinition;

  return {
    ...programDefinition,
    surveys: programDefinition.surveys.map(survey =>
      Object.fromEntries(Object.entries(survey).filter(([key]) => key !== 'questions')),
    ),
    surveySheets: programDefinition.surveys.map(survey => ({
      surveyName: survey.name,
      questions: survey.questions || [],
    })),
  };
};
