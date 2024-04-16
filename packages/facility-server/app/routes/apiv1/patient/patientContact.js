import express from 'express';
import { simpleGetList, simplePost } from '@tamanu/shared/utils/crudHelpers';
import asyncHandler from 'express-async-handler';

export const patientContact = express.Router();

patientContact.get(
  '/:id/reminderContacts',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');
    return simpleGetList('PatientContact', 'patientId', { skipPermissionCheck: true })(req, res);
  }),
);

patientContact.post(
  '/reminderContact',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Patient');
    return simplePost('PatientContact', { skipPermissionCheck: true })(req, res);
  }),
);

patientContact.delete(
  '/reminderContact/:id',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('write', 'Patient');

    const { id } = params;
    await models.PatientContact.update(
      { deletedAt: new Date() },
      {
        where: {
          id,
        },
      },
    );
    res.send({ message: 'Contact deleted successfully' });
  }),
);
