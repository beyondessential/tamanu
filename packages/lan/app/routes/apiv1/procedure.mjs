import express from 'express';

import { simpleGet, simplePut, simplePost } from '@tamanu/shared/utils/crudHelpers';

export const procedure = express.Router();

procedure.get('/:id', simpleGet('Procedure'));
procedure.put('/:id', simplePut('Procedure'));
procedure.post('/$', simplePost('Procedure'));
