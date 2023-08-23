import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { simpleGet, simplePut, simplePost } from 'shared/utils/crudHelpers';

export const locationGroup = express.Router();

locationGroup.get('/:id', simpleGet('LocationGroup'));
locationGroup.put('/:id', simplePut('LocationGroup'));
locationGroup.post('/$', simplePost('LocationGroup'));
locationGroup.get(
  '/$',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Location');
    if (!config.serverFacilityId) {
      res.send([]);
      return;
    }
    const locationGroups = await req.models.LocationGroup.findAll({
      where: {
        facilityId: config.serverFacilityId,
      },
    });
    res.send(locationGroups);
  }),
);

locationGroup.get(
  '/:id/locations',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Location');
    if (!config.serverFacilityId) {
      res.send([]);
      return;
    }
    const locations = await req.models.Location.findAll({
      where: {
        facilityId: config.serverFacilityId,
        locationGroupId: req.params.id,
      },
    });
    res.send(locations);
  }),
);

locationGroup.get(
  '/:id/handoverNotes',
  asyncHandler(async (req, res) => {
    checkHandoverNotesPermissions(req);

    if (!config.serverFacilityId) {
      res.send({});
      return;
    }

    const group = await req.models.LocationGroup.findByPk(req.params.id);

    if (!group) {
      res.status(404).send({ error: 'Location group not found.' });
      return;
    }

    const result = await req.db.query(
      `
      SELECT location_groups.name AS area,
       locations.name AS location,
       patients.display_id,
       patients.first_name,
       patients.last_name,
       patients.date_of_birth,
       patients.sex,
       encounters.start_date AS arrival_date,
       diagnosis.name AS diagnosis,
       notes.content AS notes,
       notes.created_at
        FROM locations
        INNER JOIN location_groups ON locations.location_group_id = location_groups.id
        INNER JOIN encounters ON locations.id = encounters.location_id
          AND encounters.end_date IS NULL
        INNER JOIN patients ON encounters.patient_id = patients.id
        LEFT JOIN encounter_diagnoses ON encounters.id = encounter_diagnoses.encounter_id
        LEFT JOIN (
          SELECT encounter_id, 
          STRING_AGG(
            reference_data.name || 
            ' (' || 
            CASE 
              WHEN encounter_diagnoses.certainty = 'suspected' THEN 'For investigation'
              ELSE INITCAP(encounter_diagnoses.certainty)
            END ||
            ')', 
          ', ') AS name 
          FROM encounter_diagnoses 
          LEFT JOIN reference_data ON encounter_diagnoses.diagnosis_id = reference_data.id
          WHERE encounter_diagnoses.certainty NOT IN ('disproven', 'error') 
          GROUP BY encounter_id
          ) AS diagnosis ON encounters.id = diagnosis.encounter_id
		    LEFT JOIN (
		      SELECT record_id, MAX(date) AS date
		      FROM notes
		      WHERE record_type = 'Encounter' AND note_type = 'handover'
          AND revised_by_id IS NULL
		      GROUP BY record_id
		    ) AS max_notes ON encounters.id = max_notes.record_id
		    LEFT JOIN notes ON max_notes.record_id = notes.record_id
		      AND max_notes.date = notes.date
          AND revised_by_id IS NULL
        WHERE location_groups.id = :id and locations.max_occupancy = 1
        AND locations.facility_id = :facilityId
        GROUP BY location_groups.name,
          locations.name,
          patients.display_id,
          patients.first_name,
          patients.last_name,
          patients.date_of_birth,
          patients.sex,
          encounters.start_date,
          notes.content,
          notes.created_at,
          diagnosis.name
      `,
      {
        replacements: {
          id: req.params.id,
          facilityId: config.serverFacilityId,
        },
        type: QueryTypes.SELECT,
      },
    );

    const data = result.map(item => ({
      location: item.location,
      arrivalDate: item.arrival_date,
      patient: {
        displayId: item.display_id,
        firstName: item.first_name,
        lastName: item.last_name,
        dateOfBirth: item.date_of_birth,
        sex: item.sex,
      },
      diagnosis: item.diagnosis,
      notes: item.notes,
      createdAt: item.created_at,
    }));
    res.send({ locationGroup: group, data });
  }),
);

function checkHandoverNotesPermissions(req) {
  req.checkPermission('list', 'Patient');
  req.checkPermission('read', 'LocationGroup');
  req.checkPermission('read', 'Location');
  req.checkPermission('read', 'Encounter');
  req.checkPermission('read', 'EncounterNote');
}
