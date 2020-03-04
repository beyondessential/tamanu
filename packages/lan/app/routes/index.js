import express from 'express';
import { restfulRoutes } from './restful';
import { suggestionRoutes } from './suggestions';
import { adminRoutes } from './admin';
import { getAuthMiddleware, loginHandler, refreshHandler } from '../controllers/auth/middleware';
import { seed } from './seed';
import { objectToJSON } from '../utils';
import { generateReport, getAllReports } from '../reports';

const router = express.Router();

// any route added _after_ this one will require a correctly authed user
router.use('/login', loginHandler);

router.use('/report', async (req, res) => {
  const data = await getAllReports();
  res.send(data);
});

router.use('/report/:report', async (req, res) => {
  const reportName = req.params.report;
  const params = req.query || {};
  const data = await generateReport(req.db, reportName, params);
  res.send(data);
});

router.use(getAuthMiddleware());

router.use('/me', (req, res) => {
  res.send(objectToJSON(req.user));
});

router.use('/refresh', refreshHandler);

router.use('/suggestions', suggestionRoutes);
router.use('/admin', adminRoutes);
router.put('/seed', seed);

// no-op route for debugging
router.post('/log', (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  res.send({});
});

// this middleware must be added last as it includes a
// catch-all url that will supersede anything below it
router.use('/', restfulRoutes);

export default router;
