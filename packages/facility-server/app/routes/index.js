import express from 'express';
import expressAsyncHandler from 'express-async-handler';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { apiv1 } from './apiv1';

const router = express.Router();

router.use(expressAsyncHandler(ensurePermissionCheck));

// API
router.use('/api', apiv1);

// Legacy API endpoint
router.use('/v1', apiv1);

export default router;
