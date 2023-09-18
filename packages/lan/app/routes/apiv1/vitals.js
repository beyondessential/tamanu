import express from 'express';
import { simpleGet, simplePut, simplePost } from 'shared/utils/crudHelpers';

export const vitals = express.Router();

// Notes: vitals table is legacy. You should read vitals from surveys
vitals.get('/:id', simpleGet('Vitals'));
vitals.put('/:id', simplePut('Vitals'));
vitals.post('/$', simplePost('Vitals'));
