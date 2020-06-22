import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { renameObjectKeys } from '~/utils/renameObjectKeys';

import { simpleGet, simplePut, simplePost } from './crudHelpers';

export const triage = express.Router();

triage.get('/:id', simpleGet('Triage'));
triage.put('/:id', simplePut('Triage'));
triage.post('/$', simplePost('Triage'));

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

    const {
      orderBy = 'score',
      order = 'asc',
    } = query;
    const sortKey = sortKeys[orderBy] || '1';
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const result = await db.query(
      `
        SELECT
          triages.*,
          visits.*,
          visits.id as visit_id,
          patients.*,
          location.name AS location_name,
          complaint.name AS chief_complaint
        FROM triages
          LEFT JOIN visits
           ON (visits.id = triages.visit_id)
          LEFT JOIN patients
           ON (visits.patient_id = patients.id)
          LEFT JOIN reference_data AS location
           ON (visits.location_id = location.id)
          LEFT JOIN reference_data AS complaint
           ON (triages.chief_complaint_id = complaint.id)
        ORDER BY ${sortKey} ${sortDirection} NULLS LAST
      `, 
      {
        model: Triage,
        type: QueryTypes.SELECT,
        mapToModel: true,
      }
    );

    const forResponse = result.map(x => renameObjectKeys(x.forResponse()));

    res.send({ 
      data: forResponse,
      count: result.length,
    });
  })
);
