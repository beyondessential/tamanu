const normalisePatientDataConfig = config => {
  if (!config) return config;

  let parsedConfig = config;
  if (typeof config === 'string') {
    try {
      parsedConfig = JSON.parse(config);
    } catch {
      return config;
    }
  }

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
  const column =
    fieldName === 'dateOfBirth' && displayFormat === 'age' ? 'age' : fieldName;

  return { ...rest, column };
};

const normaliseQuestion = question => ({
  ...question,
  config:
    question.type === 'PatientData'
      ? normalisePatientDataConfig(question.config)
      : question.config,
});

export const normaliseProgramDefinition = programDefinition => {
  if (!programDefinition) return programDefinition;

  if (programDefinition.surveySheets) {
    return {
      ...programDefinition,
      surveySheets: programDefinition.surveySheets.map(surveySheet => ({
        ...surveySheet,
        questions: (surveySheet.questions || []).map(normaliseQuestion),
      })),
    };
  }

  return {
    ...programDefinition,
    surveys: programDefinition.surveys.map(survey =>
      Object.fromEntries(Object.entries(survey).filter(([key]) => key !== 'questions')),
    ),
    surveySheets: programDefinition.surveys.map(survey => ({
      surveyName: survey.name,
      questions: (survey.questions || []).map(normaliseQuestion),
    })),
  };
};
