import express from 'express';
import asyncHandler from 'express-async-handler';

export const charts = express.Router();

charts.get(
  '/surveys',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Chart'); //TODO Implement permission

    const {
      models: { Survey },
    } = req;

    const chartSurveys = await Survey.getChartSurveys();

    console.log('chartSurveyssss', chartSurveys);
    res.send(chartSurveys);
  }),
);
