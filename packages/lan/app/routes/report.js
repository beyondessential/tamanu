import express from 'express';
import { generateReport, getAllReports } from '../reports';

export const reportRoutes = express.Router();

reportRoutes.get('/$', async (req, res) => {
  const data = await getAllReports();
  res.send(data);
});

reportRoutes.get('/:report', async (req, res) => {
  const reportName = req.params.report;
  const params = req.query || {};
  try {
    const data = await generateReport(req.db, reportName, params);
    res.send(data);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});
