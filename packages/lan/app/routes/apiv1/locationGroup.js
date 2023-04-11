import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { simpleGet, simplePut, simplePost } from './crudHelpers';

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
    req.checkPermission('list', 'Location');
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
       encounters.start_date,
       string_agg(reference_data.name, ', ') AS diagnosis,
       string_agg(note_items.content, ', ') AS notes,
       note_pages.created_at 
        FROM locations
        INNER JOIN location_groups ON locations.location_group_id = location_groups.id
        INNER JOIN encounters ON locations.id = encounters.location_id
          AND encounters.end_date IS NULL
        INNER JOIN patients ON encounters.patient_id = patients.id
        LEFT JOIN encounter_diagnoses ON encounters.id = encounter_diagnoses.encounter_id
        LEFT JOIN reference_data ON encounter_diagnoses.diagnosis_id = reference_data.id
        LEFT JOIN note_pages ON encounters.id = note_pages.record_id
          AND note_pages.record_type = 'Encounter'
          AND note_pages.note_type = 'handover'
        LEFT JOIN note_items ON note_items.note_page_id = note_pages.id
        WHERE location_groups.id = :id and locations.max_occupancy = 1
        and locations.facility_id = :facilityId
        GROUP BY location_groups.name,
          locations.name,
          patients.display_id,
          patients.first_name,
          patients.last_name,
          patients.date_of_birth,
          patients.sex,
          encounters.start_date,
          note_pages.created_at
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
