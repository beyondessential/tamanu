import express from 'express';
import asyncHandler from 'express-async-handler';

export const charts = express.Router();

charts.get(
  '/surveys',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Chart');

    const {
      models: { Survey },
    } = req;

    const chartSurveys = await Survey.getChartSurveys();

    res.send(chartSurveys);
  }),
);
