import express from 'express';
import { restfulRoutes } from './restful';
import AuthRoutes from './auth';
import { suggestionRoutes } from './suggestions';

const router = express.Router();
router.use('/auth', AuthRoutes);
router.use('/', restfulRoutes);
router.use('/suggestions', suggestionRoutes);

export default router;
