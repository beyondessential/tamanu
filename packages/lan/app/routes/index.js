import express from 'express';
import { apiv1 } from './apiv1';

const router = express.Router();

router.use('/v1', apiv1);

export default router;
