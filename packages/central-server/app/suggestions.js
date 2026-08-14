import { ensurePermissionCheck } from '@tamanu/shared/permissions/middleware';
import { suggestions } from '@tamanu/shared/services/suggestions';
import express from 'express';

import { anthropicModelSuggestions } from './anthropicModelSuggestions.js';

const suggestionsRoutes = express.Router();

suggestionsRoutes.use(ensurePermissionCheck);
// Central-only: it reads a central setting, and the shared router is mounted on
// facility servers too.
suggestionsRoutes.use(anthropicModelSuggestions);
suggestionsRoutes.use(suggestions);

export { suggestionsRoutes };
