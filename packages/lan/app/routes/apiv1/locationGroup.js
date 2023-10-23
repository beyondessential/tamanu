import config from 'config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { simpleGet, simplePut, simplePost } from 'shared/utils/crudHelpers';
import { DELETION_STATUSES } from '@tamanu/constants';

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

    const results = await req.db.query(
      `
      WITH 
      
      latest_root_handover_notes as (
        SELECT id, record_id, date, content
        FROM (SELECT id, record_id, date, content,
                ROW_NUMBER() OVER (PARTITION BY record_id ORDER BY date DESC) AS row_num
              FROM notes
              WHERE revised_by_id isnull 
                AND record_type = 'Encounter' 
                AND note_type = 'handover') n
        WHERE n.row_num = 1
      ),

      latest_handover_notes AS (
        -- Get the latest edited note of the latest created note
        SELECT 
          n.id,
          n.record_id,
          n.revised_by_id,
          n.content,
          n.date as created_date
        FROM (SELECT notes.id, notes.record_id, notes.revised_by_id, notes.content, latest_root_handover_notes.date,
                ROW_NUMBER() OVER (PARTITION BY revised_by_id ORDER BY notes.date DESC) AS row_num
              FROM notes
                INNER JOIN latest_root_handover_notes ON latest_root_handover_notes.id = notes.revised_by_id
              ) n
        WHERE n.row_num = 1

        UNION

        -- Get the root note of the latest created note if it has not been edited
        SELECT 
          id, 
          record_id, 
          null as revised_by_id,
          content,
          latest.date as created_date
        FROM latest_root_handover_notes latest
        WHERE NOT EXISTS (SELECT id FROM notes WHERE revised_by_id = latest.id)
      )
    
      SELECT location_groups.name AS area,
       locations.name AS location,
       patients.display_id,
       patients.first_name,
       patients.last_name,
       patients.date_of_birth,
       patients.sex,
       encounters.start_date AS arrival_date,
       diagnosis.name AS diagnosis,
       latest_handover_notes.content AS notes,
       latest_handover_notes.created_date,
       latest_handover_notes.revised_by_id notnull as is_edited
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
		    LEFT JOIN latest_handover_notes ON encounters.id = latest_handover_notes.record_id
        WHERE location_groups.id = :id 
        AND locations.max_occupancy = 1
        AND locations.facility_id = :facilityId
        AND encounters.deletion_status = :deletionStatus
        GROUP BY location_groups.name,
          locations.name,
          patients.display_id,
          patients.first_name,
          patients.last_name,
          patients.date_of_birth,
          patients.sex,
          encounters.start_date,
          latest_handover_notes.content,
          latest_handover_notes.created_date,
          latest_handover_notes.revised_by_id,
          diagnosis.name
      `,
      {
        replacements: {
          id: req.params.id,
          facilityId: config.serverFacilityId,
          deletionStatus: DELETION_STATUSES.CURRENT,
        },
        type: QueryTypes.SELECT,
      },
    );

    const data = results.map(item => ({
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
      createdAt: item.created_date,
      isEdited: item.is_edited,
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
