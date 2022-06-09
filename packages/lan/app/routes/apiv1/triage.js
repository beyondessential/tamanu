import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { InvalidParameterError } from 'shared/errors';
import { NOTE_TYPES } from 'shared/constants';

import { renameObjectKeys } from '../../utils/renameObjectKeys';

import { simpleGet, simplePut } from './crudHelpers';

export const triage = express.Router();

triage.get('/:id', simpleGet('Triage'));
triage.put('/:id', simplePut('Triage'));

triage.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models } = req;
    const { vitals, notes } = req.body;

    req.checkPermission('create', 'Triage');
    if (vitals) {
      req.checkPermission('create', 'Vitals');
    }

    const triageRecord = await models.Triage.create(req.body);

    if (vitals) {
      await models.Vitals.create({
        ...vitals,
        encounterId: triageRecord.encounterId,
      });
    }

    // The triage form groups notes as a single string for submission
    // so put it into a single note record
    if (notes) {
      await triageRecord.createNote({
        noteType: NOTE_TYPES.OTHER,
        content: notes,
      });
    }

    res.send(triageRecord);
  }),
);

const sortKeys = {
  score: 'score',
  patientName: 'UPPER(patients.last_name || patients.first_name)',
  chiefComplaint: 'chief_complaint',
  id: 'patients.display_id',
  dateOfBirth: 'patients.date_of_birth',
  locationName: 'location_name',
};

triage.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, db, query } = req;
    const { Triage } = models;

    req.checkPermission('list', 'Triage');

    const { orderBy = 'score', order = 'asc' } = query;
    const sortKey = sortKeys[orderBy];

    if (!sortKey) {
      throw new InvalidParameterError(`Cannot order by ${orderBy}.`);
    }

    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const result = await db.query(
      `
        SELECT
          triages.*,
          encounters.*,
          encounters.id as encounter_id,
          patients.*,
          location.name AS location_name,
          complaint.name AS chief_complaint
        FROM triages
          LEFT JOIN encounters
           ON (encounters.id = triages.encounter_id)
          LEFT JOIN patients
           ON (encounters.patient_id = patients.id)
          LEFT JOIN locations AS location
           ON (encounters.location_id = location.id)
          LEFT JOIN reference_data AS complaint
           ON (triages.chief_complaint_id = complaint.id)
        WHERE (encounters.encounter_type = 'triage' OR encounters.encounter_type = 'observation') AND encounters.end_date IS NULL
        ORDER BY ${sortKey} ${sortDirection} NULLS LAST
      `,
      {
        model: Triage,
        type: QueryTypes.SELECT,
        mapToModel: true,
      },
    );

    const forResponse = result.map(x => renameObjectKeys(x.forResponse()));

    res.send({
      data: forResponse,
      count: result.length,
    });
  }),
);
