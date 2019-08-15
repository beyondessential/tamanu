import express from 'express';
import { restfulRoutes } from './restful';
import AuthRoutes from './auth';
import { suggestionRoutes } from './suggestions';

const router = express.Router();
router.use('/auth', AuthRoutes);
router.use('/suggestions', suggestionRoutes);

// no-op route for debugging
router.post('/log', (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  res.send({});
});

// this middleware must be added last as it includes a 
// catch-all url that will supersede anything below it
router.use('/', restfulRoutes);

export default router;
