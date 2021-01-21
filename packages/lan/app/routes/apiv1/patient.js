import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import moment from 'moment';

import {
  simpleGet,
  simplePut,
  simplePost,
  simpleGetList,
  permissionCheckingRouter,
  runPaginatedQuery,
  simpleList,
} from './crudHelpers';

export const patient = express.Router();

patient.get('/:id', simpleGet('Patient'));
patient.put('/:id', simplePut('Patient'));
patient.post('/$', simplePost('Patient'));

const patientRelations = permissionCheckingRouter('read', 'Patient');

patientRelations.get('/:id/encounters', simpleGetList('Encounter', 'patientId'));

// TODO
// patientRelations.get('/:id/appointments', simpleGetList('Appointment', 'patientId'));

patientRelations.get('/:id/issues', simpleGetList('PatientIssue', 'patientId'));
patientRelations.get('/:id/conditions', simpleGetList('PatientCondition', 'patientId'));
patientRelations.get('/:id/allergies', simpleGetList('PatientAllergy', 'patientId'));
patientRelations.get('/:id/familyHistory', simpleGetList('PatientFamilyHistory', 'patientId'));
patientRelations.get('/:id/referrals', simpleGetList('Referral', 'patientId'));
patientRelations.get('/:id/immunisations', simpleGetList('Immunisation', 'patientId'));

patientRelations.get(
  '/:id/surveyResponses',
  asyncHandler(async (req, res) => {
    const { db, models, params, query } = req;
    const patientId = params.id;
    const result = await runPaginatedQuery(
      db,
      models.SurveyResponse,
      `
        SELECT COUNT(1) as count
        FROM
          survey_responses
          LEFT JOIN encounters
            ON (survey_responses.encounter_id = encounters.id)
        WHERE
          encounters.patient_id = :patientId
      `,
      `
        SELECT
          survey_responses.*,
          surveys.name as survey_name,
          encounters.examiner_id,
          users.display_name as assessor_name,
          programs.name as program_name
        FROM
          survey_responses
          LEFT JOIN encounters
            ON (survey_responses.encounter_id = encounters.id)
          LEFT JOIN surveys
            ON (survey_responses.survey_id = surveys.id)
          LEFT JOIN users
            ON (users.id = encounters.examiner_id)
          LEFT JOIN programs
            ON (programs.id = surveys.program_id)
        WHERE
          encounters.patient_id = :patientId
      `,
      { patientId },
      query,
    );

    res.send(result);
  }),
);

patient.use(patientRelations);

patient.get(
  '/:id/currentEncounter',
  asyncHandler(async (req, res) => {
    const {
      models: { Encounter },
      params,
    } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'Encounter');

    const currentEncounter = await Encounter.findOne({
      where: {
        patientId: params.id,
        endDate: null,
      },
      include: Encounter.getFullReferenceAssociations(),
    });

    // explicitly send as json (as it might be null)
    res.json(currentEncounter);
  }),
);

patient.get(
  '/$',
  simpleList('Patient', {
    filters: {
      displayId: `patients.display_id = :displayId`,
      firstName: `UPPER(patients.first_name) LIKE UPPER(:firstName)%`,
      lastName: `UPPER(patients.last_name) LIKE UPPER(:lastName)%`,
      culturalName: `UPPER(patients.cultural_name) LIKE UPPER(:culturalName)%`,
      villageId: `patients.village_id = :villageId`,
      locationId: `location.id = :locationId`,
      departmentId: `department.id = :departmentId`,
      inpatient: `encounters.encounter_type = 'admission'`,
      outpatient: `encounters.encounter_type = 'clinic'`,

      // Filters using calculated values
      ageMax: `patients.date_of_birth >= :dobEarliest`,
      ageMin: `patients.date_of_birth <= :dobLatest`,
    },
    transforms: {
      dobEarliest: ({ ageMax }) => ({
        dobEarliest: moment()
          .startOf('day')
          .subtract(parseFloat(ageMax) + 1, 'years')
          .add(1, 'day')
          .toDate(),
      }),
      dobLatest: ({ ageMin }) => ({
        dobLatest: moment()
          .subtract(parseFloat(ageMin), 'years')
          .endOf('day')
          .toDate(),
      })
    },
    sortKeys: {
      displayId: 'patients.display_id',
      lastName: 'UPPER(patients.last_name)',
      culturalName: 'UPPER(patients.cultural_name)',
      firstName: 'UPPER(patients.first_name)',
      age: 'patients.date_of_birth',
      dateOfBirth: 'patients.date_of_birth',
      villageName: 'village_name',
      locationName: 'location.name',
      departmentName: 'department.name',
      encounterType: 'encounters.encounter_type',
      sex: 'patients.sex',
    },
    defaults: {
      orderBy: 'lastName'
    },
    joinClause:
      `LEFT JOIN encounters
      ON(encounters.patient_id = patients.id AND encounters.end_date IS NULL)
      LEFT JOIN reference_data AS department
      ON(department.type = 'department' AND department.id = encounters.department_id)
      LEFT JOIN reference_data AS location
      ON(location.type = 'location' AND location.id = encounters.location_id)
      LEFT JOIN reference_data AS village
      ON(village.type = 'village' AND village.id = patients.village_id)
      `,
    additionalSelectClause:
      `encounters.id AS encounter_id,
      encounters.encounter_type,
      department.id AS department_id,
      department.name AS department_name,
      location.id AS location_id,
      location.name AS location_name,
      village.id AS village_id,
      village.name AS village_name
      `
  })
);