import express from 'express';
import AuthRoutes from './auth';

const router = express.Router();
router.get('/', (req, res) => res.status(403).end());
router.use('/auth', AuthRoutes);

export default router;
