const parseConfigObject = config => {
  if (typeof config !== 'string') return config;
  try {
    return JSON.parse(config);
  } catch {
    return null;
  }
};

const normalisePatientDataConfig = config => {
  if (!config) return config;

  const parsedConfig = parseConfigObject(config);
  if (
    !parsedConfig ||
    Array.isArray(parsedConfig) ||
    typeof parsedConfig !== 'object' ||
    parsedConfig.column ||
    !parsedConfig.fieldName
  ) {
    return config;
  }

  const { fieldName, displayFormat, ...rest } = parsedConfig;
  const column = fieldName === 'dateOfBirth' && displayFormat === 'age' ? 'age' : fieldName;

  return { ...rest, column };
};

const normaliseQuestion = question => ({
  ...question,
  config:
    question.type === 'PatientData'
      ? normalisePatientDataConfig(question.config)
      : question.config,
});

// Convert the legacy { surveys: [{ questions }] } shape (which the LLM
// occasionally produces) into the canonical { surveys, surveySheets } shape.
const liftLegacyQuestionsToSurveySheets = programDefinition => ({
  ...programDefinition,
  surveys: programDefinition.surveys.map(survey =>
    Object.fromEntries(Object.entries(survey).filter(([key]) => key !== 'questions')),
  ),
  surveySheets: programDefinition.surveys.map(survey => ({
    surveyName: survey.name,
    questions: (survey.questions ?? []).map(normaliseQuestion),
  })),
});

const normaliseSurveySheets = programDefinition => ({
  ...programDefinition,
  surveySheets: programDefinition.surveySheets.map(surveySheet => ({
    ...surveySheet,
    questions: (surveySheet.questions ?? []).map(normaliseQuestion),
  })),
});

export const normaliseProgramDefinition = programDefinition => {
  if (!programDefinition) return programDefinition;
  if (programDefinition.surveySheets) return normaliseSurveySheets(programDefinition);
  return liftLegacyQuestionsToSurveySheets(programDefinition);
};
