/*
 * Create a survey with required other models
 *
 * Minimum required input structure:
 * {
 *    program: { id, ...overrides },
 *    survey: { id, ...overrides },
 *    questions: [
 *      { name, type, ...overrides },
 *    ],
 * }
 */
export async function setupSurveyFromObject(models, input) {
  const { id: programId, ...programOverrides } = input?.program;
  let program;
  program = await models.Program.findOne({
    where: {
      id: programId,
    },
  });
  if (!program) {
    program = await models.Program.create({
      id: programId,
      ...programOverrides,
    });
  }

  const { id: surveyId, ...surveyOverrides } = input?.survey;
  const survey = await models.Survey.create({
    id: surveyId,
    name: surveyId,
    programId,
    ...surveyOverrides,
  });

  const dataElements = await models.ProgramDataElement.bulkCreate(
    input?.questions.map(({ name, type, ...overrides }) => ({
      name,
      type,
      code: name,
      id: `pde-${name}`,
      ...overrides,
    })),
  );

  const components = await models.SurveyScreenComponent.bulkCreate(
    input?.questions.map(({ name, id, config, validationCriteria }) => ({
      dataElementId: id || `pde-${name}`,
      surveyId: survey.id,
      config,
      validationCriteria,
    })),
  );
  return {
    survey,
    dataElements,
    components,
    program,
  };
}
