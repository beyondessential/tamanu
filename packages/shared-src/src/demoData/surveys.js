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
  const existingProgram = await models.Program.findOne({ id: programId });
  if (!existingProgram) {
    await models.Program.create({
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

  await models.ProgramDataElement.bulkCreate(
    input?.questions.map(({ name, type, ...overrides }) => ({
      name,
      type,
      code: name,
      id: `pde-${name}`,
      ...overrides,
    })),
  );

  await models.SurveyScreenComponent.bulkCreate(
    input?.questions.map(({ name, id }) => ({
      dataElementId: id || `pde-${name}`,
      surveyId: survey.id,
    })),
  );
}
