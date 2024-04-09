import express from 'express';
import { simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';

export const patientContact = express.Router();

patientContact.get(
  '/:id/reminderContacts',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');
    return simpleGetList('PatientContact', 'patientId')(req, res);
  }),
);
