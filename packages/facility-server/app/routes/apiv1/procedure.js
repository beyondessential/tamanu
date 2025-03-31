import express from 'express';

import { simpleGet, simplePost, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const procedure = express.Router();

procedure.get('/:id', simpleGet('Procedure', { auditAccess: true }));
procedure.put('/:id', simplePut('Procedure'));
procedure.post('/$', simplePost('Procedure'));
