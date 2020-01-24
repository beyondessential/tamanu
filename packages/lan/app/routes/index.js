import express from 'express';
import { apiv1 } from './apiv1';

import { ensurePermissionCheck } from '../controllers/auth/permission';

const router = express.Router();

router.use(ensurePermissionCheck);
router.use('/v1', apiv1);

export default router;
