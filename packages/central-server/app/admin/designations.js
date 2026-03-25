import express from 'express';
import { deleteDesignationById } from './designations.delete';
import { getDesignationById, getDesignations } from './designations.get';
import { createDesignation } from './designations.post';

/** `/admin/designation` endpoint for a single designation (ReferenceData) */
export const designationRouter = express.Router();

designationRouter.post('/', createDesignation);
designationRouter.get('/:id', getDesignationById);
designationRouter.delete('/:id', deleteDesignationById);

/** `/admin/designations` endpoint for listing and creating multiple designations (ReferenceData) */
export const designationsRouter = express.Router();

designationsRouter.get('/', getDesignations);
