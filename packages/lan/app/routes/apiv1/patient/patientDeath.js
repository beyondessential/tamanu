import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { InvalidOperationError, NotFoundError } from 'shared/errors';
import { User } from 'shared/models/User';
import * as yup from 'yup';

export const patientDeath = express.Router();

patientDeath.post(
  '/:id/death',
  asyncHandler(async (req, res) => {
    req.checkPermission('write', 'Patient');
    req.checkPermission('create', 'PatientDeath');

    const {
      db,
      models: { Discharge, Encounter, Patient },
      params: { id: patientId },
    } = req;

    const schema = yup.object().shape({
      date: yup.date().required(),
      physician: yup.object().shape({
        id: yup.string().required(),
      }),
    });
    const body = await schema.validate(req.body);

    const patient = await Patient.findByPk(patientId);
    if (!patient) throw new NotFoundError('Patient not found');
    if (patient.dateOfDeath) throw new InvalidOperationError('Patient is already deceased');

    const physician = await User.findByPk(body.physician.id);
    if (!physician) throw new NotFoundError('Discharge physician not found');

    await transactionOnPostgres(db, async () => {
      await patient.update({ dateOfDeath: body.date });

      const activeEncounters = await patient.getEncounters({
        where: {
          endDate: null,
        },
      });
      for (const encounter of activeEncounters) {
        await Discharge.create({
          encounterId: encounter.id,
          dischargerId: physician.id,
        });
        await encounter.update({
          endDate: body.date,
        });
      }
    });

    res.send({
      data: {},
    });
  }),
);

async function transactionOnPostgres(db, transaction) {
  if (config.db.sqlitePath) {
    return transaction();
  } else {
    return db.transaction(transaction);
  }
}
