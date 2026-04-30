import express from 'express';

import { deleteDesignationById } from './designations.delete';
import {
  getDesignationById,
  getDesignationDeletabilityById,
  getDesignations,
} from './designations.get';
import { createDesignation } from './designations.post';

/** `/admin/designation` endpoint for a single designation (ReferenceData) */
export const designationRouter = express.Router();

designationRouter.post('/', createDesignation);
designationRouter.get('/:id/isDeletable', getDesignationDeletabilityById);
designationRouter.get('/:id', getDesignationById);
designationRouter.delete('/:id', deleteDesignationById);

/** `/admin/designations` endpoint for CRUD-ing multiple designations (ReferenceData) at once */
export const designationsRouter = express.Router();

designationsRouter.get('/', getDesignations);
