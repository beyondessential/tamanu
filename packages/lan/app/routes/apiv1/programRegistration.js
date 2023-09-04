import Sequelize, { Op } from 'sequelize';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { NotFoundError, InvalidOperationError } from '@tamanu/shared/errors';
import { getFilteredListByPermission } from 'shared/utils/getFilteredListByPermission';
import {
  simpleGet,
  simplePut,
  simplePost,
  permissionCheckingRouter,
} from 'shared/utils/crudHelpers';
import { getCurrentDateString } from '../../../../shared/src/utils/dateTime';

export const patientProgramRegistration = express.Router();

patientProgramRegistration.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { db, models, query } = req;

    req.checkPermission('list', 'PatientProgramRegistration');

    const { orderBy, order = 'asc', rowsPerPage = 10, page = 0, ...filterParams } = query;

    return db.query(`
    SELECT 
      ppr.*,
      rf.registering_facility_id
    FROM patient_program_registrations ppr
    join registering_facility rf on rf.id = ppr.id
    join (
      SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY patient_id, program_registry_id ORDER BY date DESC, id DESC) AS row_num
      FROM patient_program_registrations
    ) n on n.id = ppr.id
    WHERE n.row_num = 1
    `);
  }),
);

patientProgramRegistration.post('/$', simplePost('PatientProgramRegistration'));

patientProgramRegistration.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { models, params, body } = req;
    const { id, ...registrationData } = body;
    req.checkPermission('read', 'PatientProgramRegistration');
    const registrationRecord = await models.Program.findByPk(params.id);
    if (!registrationRecord) throw new NotFoundError();

    req.checkPermission('write', registrationRecord);
    const newRecord = await models.PatientProgramRegistration.create({
      ...registrationData,
      date: getCurrentDateString(),
    });

    res.send(newRecord);
  }),
);

patientProgramRegistration.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'PatientProgramRegistration');
    const { models, ability } = req;
    const records = await models.Program.findAll({
      include: [{ association: 'surveys', where: { surveyType: 'programs' } }],
    });

    // Don't include programs that don't have any permitted survey to submit
    const canSubmit = survey => ability.can('submit', survey);
    const hasAnySurveys = programRecord => programRecord.surveys.some(canSubmit);
    const filteredRecords = records.filter(hasAnySurveys);
    const data = filteredRecords.map(x => x.forResponse());

    res.send({
      count: data.length,
      data,
    });
  }),
);
