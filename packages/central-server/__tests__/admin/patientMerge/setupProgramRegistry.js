import { SURVEY_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';

export const setupProgramRegistry = async (models) => {
  const program = await models.Program.create(fake(models.Program));
  const survey = await models.Survey.create({
    ...fake(models.Program),
    surveyType: SURVEY_TYPES.PROGRAMS,
    programId: program.id,
  });
  return models.ProgramRegistry.create(
    fake(models.ProgramRegistry, {
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      programId: survey.programId,
    }),
  );
};
