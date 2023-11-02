import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { InvalidParameterError } from '@tamanu/shared/errors';
import { NOTE_TYPES, ENCOUNTER_TYPES } from '@tamanu/constants';

import { renameObjectKeys } from '@tamanu/shared/utils';

import { simpleGet, simplePut } from '@tamanu/shared/utils/crudHelpers';

export const triage = express.Router();

triage.get('/:id', simpleGet('Triage'));
triage.put('/:id', simplePut('Triage'));

triage.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, db, user } = req;
    const { vitals, notes } = req.body;

    req.checkPermission('create', 'Triage');
    if (vitals) {
      req.checkPermission('create', 'Vitals');
    }

    const triageRecord = await models.Triage.create({ ...req.body, actorId: user.id });

    if (vitals) {
      const getDefaultId = async type => models.SurveyResponseAnswer.getDefaultId(type);
      const updatedBody = {
        locationId: vitals.locationId || (await getDefaultId('location')),
        departmentId: vitals.departmentId || (await getDefaultId('department')),
        encounterId: triageRecord.encounterId,
        userId: req.user.id,
        ...vitals,
      };
      await db.transaction(async () => {
        return models.SurveyResponse.createWithAnswers(updatedBody);
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
  // arrivalTime is an optional field and the ui prompts the user to enter it only if arrivalTime
  // is different to triageTime so we should assume the arrivalTime is the triageTime if arrivalTime
  // is undefined
  arrivalTime: 'Coalesce(arrival_time,triage_time)',
  patientName: 'UPPER(patients.last_name || patients.first_name)',
  chiefComplaint: 'chief_complaint',
  id: 'patients.display_id',
  displayId: 'patients.display_id',
  sex: 'patients.sex',
  dateOfBirth: 'patients.date_of_birth',
  locationName: 'location_name',
  locationGroupName: 'location_group_name',
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
          location_group.name AS location_group_name,
          complaint.name AS chief_complaint,
          planned_location_group.name AS planned_location_group_name,
          planned_location.name AS planned_location_name
        FROM triages
          LEFT JOIN encounters
           ON (encounters.id = triages.encounter_id)
          LEFT JOIN patients
           ON (encounters.patient_id = patients.id)
          LEFT JOIN locations AS location
           ON (encounters.location_id = location.id)
          LEFT JOIN location_groups AS location_group
            ON (location_group.id = location.location_group_id)
          LEFT JOIN reference_data AS complaint
            ON (triages.chief_complaint_id = complaint.id)
          LEFT JOIN locations AS planned_location
            ON (planned_location.id = encounters.planned_location_id)
          LEFT JOIN location_groups AS planned_location_group
            ON (planned_location.location_group_id = planned_location_group.id)
          WHERE true
          AND encounters.end_date IS NULL
          AND location.facility_id = :facility
          AND encounters.encounter_type IN (:triageEncounterTypes)
          AND encounters.deleted_at is null
        ORDER BY encounter_type IN (:seenEncounterTypes) ASC, ${sortKey} ${sortDirection} NULLS LAST, Coalesce(arrival_time,triage_time) ASC 
      `,
      {
        model: Triage,
        type: QueryTypes.SELECT,
        mapToModel: true,
        replacements: {
          facility: config.serverFacilityId,
          triageEncounterTypes: [
            ENCOUNTER_TYPES.TRIAGE,
            ENCOUNTER_TYPES.OBSERVATION,
            ENCOUNTER_TYPES.EMERGENCY,
          ],
          seenEncounterTypes: [ENCOUNTER_TYPES.OBSERVATION, ENCOUNTER_TYPES.EMERGENCY],
        },
      },
    );
    const forResponse = result.map(x => renameObjectKeys(x.forResponse()));

    res.send({
      data: forResponse,
      count: result.length,
    });
  }),
);
