import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { suggestions } from '@tamanu/shared/services/suggestions';
import express from 'express';

const suggestionsRoutes = express.Router();

suggestionsRoutes.use(ensurePermissionCheck);
suggestionsRoutes.use(suggestions);

export { suggestionsRoutes };
