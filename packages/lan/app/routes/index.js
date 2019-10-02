import express from 'express';
import { restfulRoutes } from './restful';
import AuthRoutes from './auth';
import { suggestionRoutes } from './suggestions';
import { adminRoutes } from './admin';
import { authMiddleware, loginHandler } from '../controllers/auth/middleware';

const router = express.Router();
router.use('/auth', AuthRoutes);

// any route added _after_ this one will require a correctly authed user
router.use('/login', loginHandler);
router.use(authMiddleware);

router.use('/suggestions', suggestionRoutes);
router.use('/admin', adminRoutes);

// no-op route for debugging
router.post('/log', (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  res.send({});
});

// this middleware must be added last as it includes a
// catch-all url that will supersede anything below it
router.use('/', restfulRoutes);

export default router;
