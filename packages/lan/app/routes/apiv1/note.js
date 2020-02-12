import express from 'express';

import { simpleGet, simplePut, simplePost, simpleGetList } from './crudHelpers';

export const note = express.Router();

note.get('/:id', simpleGet('Note'));
note.put('/:id', simplePut('Note'));
note.post('/$', simplePost('Note'));

