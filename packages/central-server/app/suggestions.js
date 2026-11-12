import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { suggestions } from '@tamanu/shared/services/suggestions';
import express from 'express';

import { anthropicModelSuggestions } from './anthropicModelSuggestions.js';

const suggestionsRoutes = express.Router();

suggestionsRoutes.use(ensurePermissionCheck);
suggestionsRoutes.use(anthropicModelSuggestions);
suggestionsRoutes.use(suggestions);

export { suggestionsRoutes };
