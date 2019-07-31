import express from 'express';
import RealmRoutes from './realm';
import AuthRoutes from './auth';
import { quicksearchRoutes } from './quicksearch';

const router = express.Router();
router.get('/', (req, res) => res.send('Tamanu Lan Server'));
router.use('/auth', AuthRoutes);
router.use('/realm', RealmRoutes);

router.use('/quicksearch', quicksearchRoutes);

export default router;
