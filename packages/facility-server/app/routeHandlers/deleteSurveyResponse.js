import asyncHandler from 'express-async-handler';

export const deleteSurveyResponse = asyncHandler(async (req, res) => {
  const { models, params } = req;
  req.checkPermission('delete', 'SurveyResponse');

  const model = models.SurveyResponse;
  const object = await model.findByPk(params.programResponseId);

  if (!object) {
    throw new Error(`Cannot find survey response with id ${params.programResponseId}`);
  }

  await object.destroy();
  res.send({ message: 'Survey response deleted successfully' });
});
