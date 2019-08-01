import express from 'express';
import RealmRoutes from './realm';
import AuthRoutes from './auth';
import { suggestionRoutes } from './suggestions';

const router = express.Router();
router.get('/', (req, res) => res.send('Tamanu Lan Server'));
router.use('/auth', AuthRoutes);
router.use('/realm', RealmRoutes);

router.use('/suggestions', suggestionRoutes);

export default router;
