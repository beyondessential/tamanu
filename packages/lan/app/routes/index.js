import express from 'express';
import { restfulRoutes } from './restful';
import { suggestionRoutes } from './suggestions';
import { adminRoutes } from './admin';
import { getAuthMiddleware, loginHandler, refreshHandler } from '../controllers/auth/middleware';
import { seed } from './seed';
import { objectToJSON } from '../utils';

const router = express.Router();

router.use('/login', loginHandler);

// TODO: re-enable
// any route added _after_ this one will require a correctly authed user
// router.use(getAuthMiddleware());

router.use('/me', (req, res) => {
  res.send(objectToJSON(req.user));
});

router.use('/refresh', refreshHandler);

router.use('/suggestions', suggestionRoutes);
router.use('/admin', adminRoutes);
router.put('/seed', seed);

// no-op route for debugging
// TODO: remove
router.post('/log', (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  res.send({});
});

// TODO: re-enable
// this middleware must be added last as it includes a
// catch-all url that will supersede anything below it
// router.use('/', restfulRoutes);

export default router;
