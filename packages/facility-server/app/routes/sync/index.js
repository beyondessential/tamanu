import express from 'express';

import { sync } from '../sync/sync';

export const syncRoutes = express.Router();

// sync endpoints
syncRoutes.use('/sync', sync);

export default syncRoutes;
