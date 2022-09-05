import express from 'express';
import asyncHandler from 'express-async-handler';
import { QueryTypes, Op } from 'sequelize';
import { isEqual } from 'lodash';

import { NotFoundError } from 'shared/errors';
import { PATIENT_REGISTRY_TYPES } from 'shared/constants';

import { renameObjectKeys } from '../../../utils/renameObjectKeys';
import { createPatientFilters } from '../../../utils/patientFilters';
import { patientVaccineRoutes } from './patientVaccine';
import { patientDocumentMetadataRoutes } from './patientDocumentMetadata';
import { patientInvoiceRoutes } from './patientInvoice';
import { patientRelations } from './patientRelations';
import { patientBirthData } from './patientBirthData';
import { activeCovid19PatientsHandler } from '../../../routeHandlers';
import { getOrderClause } from '../../../database/utils';
import { requestBodyToRecord, dbRecordToResponse, pickPatientBirthData } from './utils';
import { PATIENT_SORT_KEYS } from './constants';

const patientRoute = express.Router();

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
      models: { Patient, PatientAdditionalData, PatientBirthData },
      params,
    } = req;
    req.checkPermission('read', 'Patient');
    const patient = await Patient.findByPk(params.id);
    if (!patient) {
      throw new NotFoundError();
    }

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

      const patientBirth = await PatientBirthData.findOne({
        where: { patientId: patient.id },
      });
      const recordData = requestBodyToRecord(req.body);
      const patientBirthRecordData = pickPatientBirthData(PatientBirthData, recordData);

      if (!patientBirth) {
        if (!isEqual(req.body, { markedForSync: true })) {
          await PatientBirthData.create({
            ...patientBirthRecordData,
            patientId: patient.id,
          });
        }
      } else {
        await patientBirth.update(patientBirthRecordData);
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
      models: { Patient, PatientAdditionalData, PatientBirthData },
    } = req;
    req.checkPermission('create', 'Patient');
    const requestData = requestBodyToRecord(req.body);
    const { patientRegistryType, ...patientData } = requestData;

    const patientRecord = await db.transaction(async () => {
      const createdPatient = await Patient.create(patientData);
      const patientAdditionalBirthData =
        patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY
          ? { motherId: patientData.motherId, fatherId: patientData.fatherId }
          : {};

      await PatientAdditionalData.create({
        ...patientData,
        ...patientAdditionalBirthData,
        patientId: createdPatient.id,
      });

      if (patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY) {
        await PatientBirthData.create({
          ...pickPatientBirthData(PatientBirthData, patientData),
          patientId: createdPatient.id,
        });
      }
      return createdPatient;
    });
    res.send(dbRecordToResponse(patientRecord));
  }),
);

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

    const sortKey = PATIENT_SORT_KEYS[orderBy] || PATIENT_SORT_KEYS.displayId;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    // add secondary search terms so no matter what the primary order, the results are secondarily
    // sorted sensibly
    const secondarySearchTerm = [
      PATIENT_SORT_KEYS.lastName,
      PATIENT_SORT_KEYS.firstName,
      PATIENT_SORT_KEYS.displayId,
    ]
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
            WHEN encounters.encounter_type = 'triage' THEN 'emergency'
            WHEN encounters.encounter_type = 'clinic' THEN 'outpatient'
            WHEN encounters.encounter_type = 'imaging' THEN 'outpatient'
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

patientRoute.get('/program/activeCovid19Patients', asyncHandler(activeCovid19PatientsHandler));

patientRoute.use(patientRelations);
patientRoute.use(patientVaccineRoutes);
patientRoute.use(patientDocumentMetadataRoutes);
patientRoute.use(patientInvoiceRoutes);
patientRoute.use(patientBirthData);

export { patientRoute as patient };
