import express from 'express';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { suggestions } from '@tamanu/shared/services/suggestions';

const suggestionsRoutes = express.Router();

suggestionsRoutes.use(ensurePermissionCheck);
suggestionsRoutes.use(suggestions);

export { suggestionsRoutes };
