import asyncHandler from 'express-async-handler';
import { subject } from '@casl/ability';

export const deleteChartInstance = () =>
  asyncHandler(async (req, res) => {
    const { db, params, models } = req;
    const { chartInstanceResponseId } = params;

    const surveyResponse = await models.SurveyResponse.findByPk(chartInstanceResponseId);
    req.checkPermission('delete', subject('Charting', { id: surveyResponse?.surveyId }));

    // all answers will also be soft deleted automatically
    await db.transaction(async () => {
      await models.SurveyResponse.destroy({ where: { id: chartInstanceResponseId } });

      await models.SurveyResponse.destroy({
        where: { 'metadata.chartInstanceResponseId': chartInstanceResponseId },
      });
    });

    res.send({});
  });
