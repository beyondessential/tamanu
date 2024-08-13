import { subject } from '@casl/ability';

export const getPermittedSurveyIds = async (req, models) => {
  // Number of surveys should not be too large, so it's ok to load all survey ids into the memory
  const surveys = await models.Survey.findAll({ attributes: ['id'] });

  // Use this list of permittedSurveyIds in the query to only grab the survey responses
  // user has permission to read
  return surveys
    .filter(survey => req.ability.can('read', subject('Survey', { id: survey.id })))
    .map(survey => survey.id);
};
