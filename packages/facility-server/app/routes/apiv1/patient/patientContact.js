import { simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { WS_EVENTS } from '@tamanu/constants';

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
    const { models, websocketClientService } = req;
    const patientContact = await models.PatientContact.create(req.body);
    websocketClientService?.emit(WS_EVENTS.PATIENT_CONTACT_INSERT, patientContact.dataValues);
    res.send(patientContact);
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
