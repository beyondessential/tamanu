import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Op } from 'sequelize';
import { isEqual } from 'lodash';
import { getPatientAdditionalData } from 'shared/utils';
import { NotFoundError } from 'shared/errors';

import { simpleGetList, permissionCheckingRouter, runPaginatedQuery } from './crudHelpers';
import { renameObjectKeys } from '../../utils/renameObjectKeys';
import { createPatientFilters } from '../../utils/patientFilters';
import { patientVaccineRoutes } from './patient/patientVaccine';
import { patientDocumentMetadataRoutes } from './patient/patientDocumentMetadata';
import { patientInvoiceRoutes } from './patient/patientInvoice';
import { patientSecondaryIdRoutes } from './patient/patientSecondaryId';
import { patientDeath } from './patient/patientDeath';
import { patientProfilePicture } from './patient/patientProfilePicture';
import { activeCovid19PatientsHandler } from '../../routeHandlers';
import { getOrderClause } from '../../database/utils';

const patientRoute = express.Router();
export { patientRoute as patient };

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

patientRoute.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { Patient },
      params,
    } = req;
    req.checkPermission('read', 'Patient');
    const patient = await Patient.findByPk(params.id, {
      include: Patient.getFullReferenceAssociations(),
    });
    if (!patient) throw new NotFoundError();

    res.send(dbRecordToResponse(patient));
  }),
);

patientRoute.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      db,
      models: { Patient, PatientAdditionalData },
      params,
    } = req;
    req.checkPermission('read', 'Patient');
    const patient = await Patient.findByPk(params.id);
    if (!patient) throw new NotFoundError();
    req.checkPermission('write', patient);

    await db.transaction(async () => {
      await patient.update(requestBodyToRecord(req.body));

      const patientAdditionalData = await PatientAdditionalData.findOne({
        where: { patientId: patient.id },
      });

      if (!patientAdditionalData) {
        // Do not try to create patient additional data if all we're trying to update is markedForSync = true to
        // sync down patient because PatientAdditionalData will be automatically synced down along with Patient
        if (!isEqual(req.body, { markedForSync: true })) {
          await PatientAdditionalData.create({
            ...requestBodyToRecord(req.body),
            patientId: patient.id,
          });
        }
      } else {
        await patientAdditionalData.update(requestBodyToRecord(req.body));
      }
    });

    res.send(dbRecordToResponse(patient));
  }),
);

patientRoute.post(
  '/$',
  asyncHandler(async (req, res) => {
    const {
      db,
      models: { Patient, PatientAdditionalData },
    } = req;
    req.checkPermission('create', 'Patient');
    const patientData = requestBodyToRecord(req.body);

    const patientRecord = await db.transaction(async () => {
      const createdPatient = await Patient.create(patientData);
      await PatientAdditionalData.create({
        ...patientData,
        patientId: createdPatient.id,
      });
      return createdPatient;
    });
    res.send(dbRecordToResponse(patientRecord));
  }),
);

const patientRelations = permissionCheckingRouter('read', 'Patient');

patientRelations.get(
  '/:id/encounters',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Encounter');
    const {
      models: { Encounter },
      params,
      query,
    } = req;
    const { order = 'ASC', orderBy, open = false } = query;

    const objects = await Encounter.findAll({
      where: {
        patientId: params.id,
        ...(open && { endDate: null }),
      },
      order: orderBy ? [[orderBy, order.toUpperCase()]] : undefined,
    });

    const data = objects.map(x => x.forResponse());

    res.send({
      count: objects.length,
      data,
    });
  }),
);

// TODO
// patientRelations.get('/:id/appointments', simpleGetList('Appointment', 'patientId'));

patientRelations.get('/:id/issues', simpleGetList('PatientIssue', 'patientId'));
patientRelations.get('/:id/conditions', simpleGetList('PatientCondition', 'patientId'));
patientRelations.get('/:id/allergies', simpleGetList('PatientAllergy', 'patientId'));
patientRelations.get('/:id/familyHistory', simpleGetList('PatientFamilyHistory', 'patientId'));
patientRelations.get('/:id/carePlans', simpleGetList('PatientCarePlan', 'patientId'));

patientRelations.get(
  '/:id/additionalData',
  asyncHandler(async (req, res) => {
    const { models, params } = req;

    req.checkPermission('read', 'Patient');

    const additionalDataRecord = await models.PatientAdditionalData.findOne({
      where: { patientId: params.id },
      include: models.PatientAdditionalData.getFullReferenceAssociations(),
    });

    // Lookup survey responses for passport and nationality to fill patient additional data
    // Todo: Remove when WAITM-243 is complete
    const passport = await getPatientAdditionalData(models, params.id, 'passport');
    const nationalityId = await getPatientAdditionalData(models, params.id, 'nationalityId');
    const nationality = nationalityId
      ? await models.ReferenceData.findByPk(nationalityId)
      : undefined;

    const recordData = additionalDataRecord ? additionalDataRecord.toJSON() : {};
    res.send({ ...recordData, passport, nationality, nationalityId });
  }),
);

patientRelations.use(patientProfilePicture);
patientRelations.use(patientDeath);
patientRelations.use(patientSecondaryIdRoutes);

patientRelations.get(
  '/:id/referrals',
  asyncHandler(async (req, res) => {
    const { models, params } = req;
    req.checkPermission('list', 'SurveyResponse');

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
            {
              association: 'survey',
              include: [
                {
                  association: 'components',
                  include: [
                    {
                      association: 'dataElement',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    res.send({ count: patientReferrals.length, data: patientReferrals });
  }),
);

patientRelations.get(
  '/:id/programResponses',
  asyncHandler(async (req, res) => {
    const { db, models, params, query } = req;
    req.checkPermission('list', 'SurveyResponse');
    const patientId = params.id;
    const { surveyId, surveyType = 'programs' } = query;
    const { count, data } = await runPaginatedQuery(
      db,
      models.SurveyResponse,
      `
        SELECT COUNT(1) as count
        FROM
          survey_responses
          LEFT JOIN encounters
            ON (survey_responses.encounter_id = encounters.id)
          LEFT JOIN surveys
            ON (survey_responses.survey_id = surveys.id)
        WHERE
          encounters.patient_id = :patientId
          AND surveys.survey_type = :surveyType
          ${surveyId ? 'AND surveys.id = :surveyId' : ''}
      `,
      `
        SELECT
          survey_responses.*,
          surveys.id as survey_id,
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
          AND surveys.survey_type = :surveyType
          ${surveyId ? 'AND surveys.id = :surveyId' : ''}
      `,
      { patientId, surveyId, surveyType },
      query,
    );

    res.send({
      count: parseInt(count, 10),
      data,
    });
  }),
);

patientRoute.use(patientRelations);

patientRoute.get(
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

patientRoute.get(
  '/:id/lastDischargedEncounter/medications',
  asyncHandler(async (req, res) => {
    const {
      models: { Encounter, EncounterMedication },
      params,
      query,
    } = req;

    const { order = 'ASC', orderBy, rowsPerPage = 10, page = 0 } = query;

    req.checkPermission('read', 'Patient');
    req.checkPermission('read', 'Encounter');
    req.checkPermission('list', 'EncounterMedication');

    const lastDischargedEncounter = await Encounter.findOne({
      where: {
        patientId: params.id,
        endDate: { [Op.not]: null },
      },
      order: [['endDate', 'DESC']],
    });

    // Return empty values if there isn't a discharged encounter
    if (!lastDischargedEncounter) {
      res.send({
        count: 0,
        data: [],
      });
      return;
    }

    // Find and return all associated encounter medications
    const lastEncounterMedications = await EncounterMedication.findAndCountAll({
      where: { encounterId: lastDischargedEncounter.id, isDischarge: true },
      include: [
        ...EncounterMedication.getFullReferenceAssociations(),
        { association: 'encounter', include: [{ association: 'location' }] },
      ],
      order: orderBy ? getOrderClause(order, orderBy) : undefined,
      limit: rowsPerPage,
      offset: page * rowsPerPage,
    });

    const { count } = lastEncounterMedications;
    const data = lastEncounterMedications.rows.map(x => x.forResponse());

    res.send({
      count,
      data,
    });
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

patientRoute.get(
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

    const filters = createPatientFilters(filterParams);
    const whereClauses = filters.map(f => f.sql).join(' AND ');

    const from = `
      FROM patients
        LEFT JOIN (
            SELECT patient_id, max(start_date) AS most_recent_open_encounter
            FROM encounters
            WHERE end_date IS NULL
            GROUP BY patient_id
          ) recent_encounter_by_patient
          ON patients.id = recent_encounter_by_patient.patient_id
        LEFT JOIN encounters
          ON (patients.id = encounters.patient_id AND recent_encounter_by_patient.most_recent_open_encounter = encounters.start_date)
        LEFT JOIN departments AS department
          ON (department.id = encounters.department_id)
        LEFT JOIN locations AS location
          ON (location.id = encounters.location_id)
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

    const count = parseInt(countResult[0].count, 10);

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
          CASE
            WHEN patients.date_of_death IS NOT NULL THEN 'deceased'
            WHEN encounters.encounter_type = 'emergency' THEN 'emergency'
            WHEN encounters.encounter_type = 'clinic' THEN 'outpatient'
            WHEN encounters.encounter_type IS NOT NULL THEN 'inpatient'
            ELSE NULL
          END AS patient_status,
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

patientRoute.get('/program/activeCovid19Patients', asyncHandler(activeCovid19PatientsHandler));

patientRoute.use(patientVaccineRoutes);
patientRoute.use(patientDocumentMetadataRoutes);

patientRoute.use(patientInvoiceRoutes);

patientRoute.get(
  '/:id/covidLabTests',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');

    const { models, params } = req;
    const { Patient } = models;

    const patient = await Patient.findByPk(params.id);
    const labTests = await patient.getCovidLabTests();

    res.json({ data: labTests, count: labTests.length });
  }),
);
