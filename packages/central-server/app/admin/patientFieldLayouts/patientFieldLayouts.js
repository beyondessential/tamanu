import express from 'express';

import { getPatientFieldLayouts } from './patientFieldLayouts.get';
import {
  reorderPatientFieldLayouts,
  updatePatientFieldLayoutVisibility,
} from './patientFieldLayouts.put';

export const patientFieldLayoutsRouter = express.Router();

patientFieldLayoutsRouter.get('/', getPatientFieldLayouts);
patientFieldLayoutsRouter.put('/reorder', reorderPatientFieldLayouts);
patientFieldLayoutsRouter.put('/:id/visibility', updatePatientFieldLayoutVisibility);
