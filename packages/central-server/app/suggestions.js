import express from 'express';
import expressAsyncHandler from 'express-async-handler';

import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { suggestions } from '@tamanu/shared/services/suggestions';

const suggestionsRoutes = express.Router();

suggestionsRoutes.use(expressAsyncHandler(ensurePermissionCheck));
suggestionsRoutes.use(suggestions);

export { suggestionsRoutes };
