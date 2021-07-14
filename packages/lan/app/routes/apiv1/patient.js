import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import moment from 'moment';

import { NotFoundError } from 'shared/errors';
import { simpleGetList, permissionCheckingRouter, runPaginatedQuery } from './crudHelpers';

import { renameObjectKeys } from '~/utils/renameObjectKeys';
import { makeFilter } from '~/utils/query';
import { patientVaccineRoutes } from './patient/patientVaccine';
import { patientProfilePicture } from './patient/patientProfilePicture';

export const patient = express.Router();

function dbRecordToResponse(patientRecord) {
  return {
    ...patientRecord.get({
      plain: true,
    }),
  };
}

function requestBodyToRecord(reqBody) {
  return {
    ...reqBody,
  };
}

patient.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { Patient },
      params,
    } = req;
    req.checkPermission('read', 'Patient');
    const _patient = await Patient.findByPk(params.id, {
      include: Patient.getFullReferenceAssociations(),
    });
    if (!_patient) throw new NotFoundError();

    res.send(dbRecordToResponse(_patient));
  }),
);

patient.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { Patient, PatientAdditionalData },
      params,
    } = req;
    console.log(id, params);
    req.checkPermission('read', 'Patient');
    const _patient = await Patient.findByPk(params.id);
    if (!_patient) throw new NotFoundError();
    req.checkPermission('write', _patient);
    await _patient.update(requestBodyToRecord(req.body));

    const patientAdditionalData = await PatientAdditionalData.findOne({
      where: { patientId: patient.id },
    });

    if (!patientAdditionalData) {
      await PatientAdditionalData.create({
        ...requestBodyToRecord(req.body),
        patientId: _patient.id,
      });
    } else {
      await patientAdditionalData.update(requestBodyToRecord(req.body));
    }

    res.send(dbRecordToResponse(_patient));
  }),
);

patient.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      db,
      models: { Patient, PatientAdditionalData },
    } = req;
    req.checkPermission('create', 'Patient');
    const patientData = requestBodyToRecord(req.body);

    await db.transaction(async () => {
      const patientRecord = await Patient.create(patientData);

      await PatientAdditionalData.create({
        ...patientData,
        patientId: patientRecord.id,
      });

      res.send(dbRecordToResponse(patientRecord));
    });
  }),
);

const patientRelations = permissionCheckingRouter('read', 'Patient');

patientRelations.get('/:id/encounters', simpleGetList('Encounter', 'patientId'));

// TODO
// patientRelations.get('/:id/appointments', simpleGetList('Appointment', 'patientId'));

patientRelations.get('/:id/issues', simpleGetList('PatientIssue', 'patientId'));
patientRelations.get('/:id/conditions', simpleGetList('PatientCondition', 'patientId'));
patientRelations.get('/:id/allergies', simpleGetList('PatientAllergy', 'patientId'));
patientRelations.get('/:id/familyHistory', simpleGetList('PatientFamilyHistory', 'patientId'));
patientRelations.get('/:id/immunisations', simpleGetList('Immunisation', 'patientId'));
patientRelations.get('/:id/carePlans', simpleGetList('PatientCarePlan', 'patientId'));

patientRelations.get(
  '/:id/additionalData',
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    req.checkPermission('read', 'Patient');

    const additionalData = await models.PatientAdditionalData.findOne({
      where: { patientId: params.id },
      include: models.PatientAdditionalData.getFullReferenceAssociations(),
    });

    res.send(additionalData || {});
  }),
);

patientRelations.use(patientProfilePicture);

patientRelations.get(
  '/:id/referrals',
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'Encounter');

    const patientReferrals = await models.Referral.findAll({
      include: [
        {
          association: 'initiatingEncounter',
          where: {
            '$initiatingEncounter.patient_id$': params.id,
          },
        },
        {
          association: 'surveyResponse',
          include: [
            {
              association: 'answers',
            },
          ],
        },
      ],
    });

    res.send({ count: patientReferrals.length, data: patientReferrals });
  }),
);

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

const sortKeys = {
  markedForSync: 'patients.marked_for_sync',
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
};

patient.get(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      models: { Patient },
      query,
    } = req;

    req.checkPermission('list', 'Patient');

    const {
      orderBy = 'lastName',
      order = 'asc',
      rowsPerPage = 10,
      page = 0,
      ...filterParams
    } = query;

    const sortKey = sortKeys[orderBy] || sortKeys.displayId;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    // add secondary search terms so no matter what the primary order, the results are secondarily
    // sorted sensibly
    const secondarySearchTerm = [sortKeys.lastName, sortKeys.firstName, sortKeys.displayId]
      .filter(v => v !== orderBy)
      .map(v => `${v} ASC`)
      .join(', ');

    // query is always going to come in as strings, has to be set manually
    ['ageMax', 'ageMin']
      .filter(k => filterParams[k])
      .forEach(k => {
        filterParams[k] = parseFloat(filterParams[k]);
      });

    const filters = [
      makeFilter(filterParams.displayId, `patients.display_id = :displayId`),
      makeFilter(
        filterParams.firstName,
        `UPPER(patients.first_name) LIKE UPPER(:firstName)`,
        ({ firstName }) => ({ firstName: `${firstName}%` }),
      ),
      makeFilter(
        filterParams.lastName,
        `UPPER(patients.last_name) LIKE UPPER(:lastName)`,
        ({ lastName }) => ({ lastName: `${lastName}%` }),
      ),
      makeFilter(
        filterParams.culturalName,
        `UPPER(patients.cultural_name) LIKE UPPER(:culturalName)`,
        ({ culturalName }) => ({ culturalName: `${culturalName}%` }),
      ),
      // For age filter
      makeFilter(filterParams.ageMax, `patients.date_of_birth >= :dobMin`, ({ ageMax }) => ({
        dobMin: moment()
          .startOf('day')
          .subtract(ageMax + 1, 'years')
          .add(1, 'day')
          .toDate(),
      })),
      makeFilter(filterParams.ageMin, `patients.date_of_birth <= :dobMax`, ({ ageMin }) => ({
        dobMax: moment()
          .subtract(ageMin, 'years')
          .endOf('day')
          .toDate(),
      })),
      // For DOB filter
      makeFilter(
        filterParams.dateOfBirthFrom,
        `DATE(patients.date_of_birth) >= :dateOfBirthFrom`,
        ({ dateOfBirthFrom }) => ({
          dateOfBirthFrom: moment(dateOfBirthFrom)
            .startOf('day')
            .toISOString(),
        }),
      ),
      makeFilter(
        filterParams.dateOfBirthTo,
        `DATE(patients.date_of_birth) <= :dateOfBirthTo`,
        ({ dateOfBirthTo }) => ({
          dateOfBirthTo: moment(dateOfBirthTo)
            .endOf('day')
            .toISOString(),
        }),
      ),
      makeFilter(filterParams.villageId, `patients.village_id = :villageId`),
      makeFilter(filterParams.locationId, `location.id = :locationId`),
      makeFilter(filterParams.departmentId, `department.id = :departmentId`),
      makeFilter(filterParams.inpatient, `encounters.encounter_type = 'admission'`),
      makeFilter(filterParams.outpatient, `encounters.encounter_type = 'clinic'`),
    ].filter(f => f);

    const whereClauses = filters.map(f => f.sql).join(' AND ');




    const from = `
      FROM patients
        LEFT JOIN (
            SELECT patient_id, max(start_date) AS most_recent_open_encounter
            FROM encounters
            WHERE end_date IS NULL
            GROUP BY patient_id
          ) encounters_abc
        ON patients.id = encounters_abc.patient_id
        LEFT JOIN encounters
          ON (patients.id = encounters.patient_id AND encounters_abc.most_recent_open_encounter = encounters.start_date)
        LEFT JOIN reference_data AS department
          ON (department.type = 'department' AND department.id = encounters.department_id)
        LEFT JOIN reference_data AS location
          ON (location.type = 'location' AND location.id = encounters.location_id)
        LEFT JOIN reference_data AS village
          ON (village.type = 'village' AND village.id = patients.village_id)
      ${whereClauses && `WHERE ${whereClauses}`}
    `;

    const filterReplacements = filters
      .filter(f => f.transform)
      .reduce(
        (current, { transform }) => ({
          ...current,
          ...transform(current),
        }),
        filterParams,
      );

    const countResult = await req.db.query(`SELECT COUNT(1) AS count ${from}`, {
      replacements: filterReplacements,
      type: QueryTypes.SELECT,
    });

    const { count } = countResult[0];

    if (count === 0) {
      // save ourselves a query
      res.send({ data: [], count });
      return;
    }

    const result = await req.db.query(
      `
        SELECT
          patients.*,
          encounters.id AS encounter_id,
          encounters.encounter_type,
          department.id AS department_id,
          department.name AS department_name,
          location.id AS location_id,
          location.name AS location_name,
          village.id AS village_id,
          village.name AS village_name
        ${from}

        ORDER BY ${sortKey} ${sortDirection}, ${secondarySearchTerm} NULLS LAST
        LIMIT :limit
        OFFSET :offset
      `,
      {
        replacements: {
          ...filterReplacements,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
        },
        model: Patient,
        type: QueryTypes.SELECT,
        mapToModel: true,
      },
    );

    const forResponse = result.map(x => renameObjectKeys(x.forResponse()));

    res.send({
      data: forResponse,
      count,
    });
  }),
);

patient.use(patientVaccineRoutes);
