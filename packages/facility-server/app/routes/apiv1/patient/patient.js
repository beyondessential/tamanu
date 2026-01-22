import express from 'express';
import asyncHandler from 'express-async-handler';
import { literal, QueryTypes, Op } from 'sequelize';
import { snakeCase } from 'lodash';

import {
  createPatientSchema,
  updatePatientSchema,
} from '@tamanu/shared/schemas/facility/requests/createPatient.schema';
import { NotFoundError, InvalidParameterError } from '@tamanu/errors';
import {
  PATIENT_REGISTRY_TYPES,
  VISIBILITY_STATUSES,
  IPS_REQUEST_STATUSES,
  ENCOUNTER_TYPES,
  DRUG_ROUTE_LABELS,
} from '@tamanu/constants';
import { isGeneratedDisplayId } from '@tamanu/utils/generateId';

import { renameObjectKeys } from '@tamanu/utils/renameObjectKeys';
import { createPatientFilters } from '../../../utils/patientFilters';
import { patientVaccineRoutes } from './patientVaccine';
import { patientDocumentMetadataRoutes } from './patientDocumentMetadata';
import { patientInvoiceRoutes } from './patientInvoice';
import { patientRelations } from './patientRelations';
import { patientBirthData } from './patientBirthData';
import { patientLocations } from './patientLocations';
import {
  patientProgramRegistration,
  patientProgramRegistrationConditions,
} from './patientProgramRegistration';
import { dbRecordToResponse, pickPatientBirthData, requestBodyToRecord, savePatientInsurancePlans } from './utils';
import { PATIENT_SORT_KEYS } from './constants';
import { getWhereClausesAndReplacementsFromFilters } from '../../../utils/query';
import { validate } from '../../../utils/validate';
import { patientContact } from './patientContact';
import { patientPortal } from './patientPortal';
import { patientInsurancePlans } from './patientInsurancePlans';

const patientRoute = express.Router();

patientRoute.post(
  '/checkDuplicates',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');
    const { models, body: patient } = req;

    const potentialDuplicates = await models.Patient.sequelize.query(
      `SELECT
        p.*,
        reference_data.name AS "villageName"
      FROM find_potential_patient_duplicates(:patient) p
      LEFT JOIN reference_data
        ON reference_data.id = p.village_id`,
      {
        replacements: { patient: JSON.stringify(patient) },
        type: QueryTypes.SELECT,
        model: models.Patient,
        mapToModel: true,
      },
    );

    res.send({ data: potentialDuplicates });
  }),
);

patientRoute.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      models: { Patient },
      params,
      query: { facilityId },
    } = req;
    req.checkPermission('read', 'Patient');
    const patient = await Patient.findByPk(params.id, {
      include: Patient.getFullReferenceAssociations(),
    });
    if (!patient) throw new NotFoundError();

    await req.audit.access({
      recordId: params.id,
      frontEndContext: params,
      model: Patient,
    });

    res.send(dbRecordToResponse(patient, facilityId));
  }),
);

patientRoute.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const {
      db,
      models: { Patient, PatientAdditionalData, PatientBirthData, PatientSecondaryId, PatientInvoiceInsurancePlan },
      params,
      body: { facilityId, ...body },
    } = req;
    req.checkPermission('read', 'Patient');
    const patient = await Patient.findByPk(params.id);

    if (!patient) {
      throw new NotFoundError();
    }

    req.checkPermission('write', patient);

    let invoiceInsurancePlanId;
    try {
      invoiceInsurancePlanId = body.invoiceInsurancePlanId ? JSON.parse(body.invoiceInsurancePlanId) : undefined;
    } catch (error) {
      throw new InvalidParameterError('Invalid invoice insurance plan id');
    }

    const updatePatientBody = {
      ...body,
      facilityId,
      invoiceInsurancePlanId,
    };
    const validatedBody = validate(updatePatientSchema, updatePatientBody);

    await db.transaction(async () => {
      // First check if displayId changed to create a secondaryId record
      if (validatedBody.displayId && validatedBody.displayId !== patient.displayId) {
        const oldDisplayIdType = isGeneratedDisplayId(patient.displayId)
          ? 'secondaryIdType-tamanu-display-id'
          : 'secondaryIdType-nhn';
        await PatientSecondaryId.create({
          value: patient.displayId,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
          typeId: oldDisplayIdType,
          patientId: patient.id,
        });
      }

      await patient.update(requestBodyToRecord(validatedBody));

      const patientAdditionalData = await PatientAdditionalData.findOne({
        where: { patientId: patient.id },
      });

      if (!patientAdditionalData) {
        await PatientAdditionalData.create({
          ...requestBodyToRecord(validatedBody),
          patientId: patient.id,
        });
      } else {
        await patientAdditionalData.update(requestBodyToRecord(validatedBody));
      }

      const patientBirth = await PatientBirthData.findOne({
        where: { patientId: patient.id },
      });
      const recordData = requestBodyToRecord(validatedBody);
      const patientBirthRecordData = pickPatientBirthData(PatientBirthData, recordData);

      if (patientBirth) {
        await patientBirth.update(patientBirthRecordData);
      }

      await patient.writeFieldValues(validatedBody.patientFields);

      await savePatientInsurancePlans(PatientInvoiceInsurancePlan, patient.id, validatedBody.invoiceInsurancePlanId);
    });

    res.send(dbRecordToResponse(patient, facilityId));
  }),
);

patientRoute.post(
  '/$',
  asyncHandler(async (req, res) => {
    const { db, models, body } = req;
    const { Patient, PatientAdditionalData, PatientBirthData, PatientFacility, PatientInvoiceInsurancePlan } = models;

    req.checkPermission('create', 'Patient');

    let invoiceInsurancePlanId;
    try {
      invoiceInsurancePlanId = body.invoiceInsurancePlanId ? JSON.parse(body.invoiceInsurancePlanId) : undefined;
    } catch (error) {
      throw new InvalidParameterError('Invalid invoice insurance plan id');
    }

    const createPatientBody = {
      ...body,
      invoiceInsurancePlanId,
    };
    const validatedBody = validate(createPatientSchema, createPatientBody);

    const requestData = requestBodyToRecord(validatedBody);
    const { patientRegistryType, facilityId, ...patientData } = requestData;

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
      await createdPatient.writeFieldValues(validatedBody.patientFields);

      if (patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY) {
        await PatientBirthData.create({
          ...pickPatientBirthData(PatientBirthData, patientData),
          patientId: createdPatient.id,
        });
      }

      // mark for sync in this facility
      await PatientFacility.create({ facilityId, patientId: createdPatient.id });

      await savePatientInsurancePlans(PatientInvoiceInsurancePlan, createdPatient.id, validatedBody.invoiceInsurancePlanId);

      return createdPatient;
    });

    res.send(dbRecordToResponse(patientRecord, facilityId));
  }),
);

patientRoute.get(
  '/:id/currentEncounter',
  asyncHandler(async (req, res) => {
    const {
      models: { Encounter },
      params,
      query: { facilityId },
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

    if (currentEncounter) {
      await req.audit.access({
        recordId: currentEncounter.id,
        frontEndContext: params,
        model: Encounter,
        facilityId,
      });
    }

    // explicitly send as json (as it might be null)
    res.json(currentEncounter);
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

    const { orderBy, order = 'asc', rowsPerPage = 10, page = 0, ...filterParams } = query;

    const sortKey = PATIENT_SORT_KEYS[orderBy] || PATIENT_SORT_KEYS.lastName;
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

    let filterSort = '';
    let filterSortReplacements = {};
    // If there is a sort selected by the user, it shouldn't use exact match sort.
    // The search is complex and it has more details over this https://linear.app/bes/issue/TAN-2038/desktop-improve-patient-listing-search-fields
    // Basically, we are sorting results based on the following rules:
    // 1) if the user selects a column to sort, this is our first priority.
    // 2) In case the user used one of the filters = "Display Id", "Last Name", "First Name", we have some special rules.
    // 2.a) If there is an exact match for 'display Id', 'last name', 'first name, it should display those results on top
    // 2.b) In the case we have a exact match for two or more columns listed above, we will display it sorted by display id, last name, and first name
    // 2.c) After the exact match is applied, we should prioritize the results that starts with the text the user inserted.
    // 2.d) the same rule of 2.b is applied in case we have two or more columns starting with what the user selected.
    // 2.e) The last rule for selected filters, is, if the user has selected any of those filters, we should also sort them alphabetically.
    if (!orderBy) {
      const selectedFilters = ['displayId', 'lastName', 'firstName'].filter(v => filterParams[v]);
      if (selectedFilters?.length) {
        filterSortReplacements = selectedFilters.reduce((acc, filter) => {
          return {
            ...acc,
            [`exactMatchSort${filter}`]: filterParams[filter].toUpperCase(),
            [`beginsWithSort${filter}`]: `${filterParams[filter].toUpperCase()}%`,
          };
        }, {});

        // Exact match sort
        const exactMatchSort = selectedFilters
          .map(
            filter => `upper(patients.${snakeCase(filter)}) = ${`:exactMatchSort${filter}`} DESC`,
          )
          .join(', ');

        // Begins with sort
        const beginsWithSort = selectedFilters
          .map(filter => `upper(patients.${snakeCase(filter)}) LIKE :beginsWithSort${filter} DESC`)
          .join(', ');

        // the last one is
        const alphabeticSort = selectedFilters
          .map(filter => `patients.${snakeCase(filter)} ASC`)
          .join(', ');

        filterSort = `${exactMatchSort}, ${beginsWithSort}, ${alphabeticSort}`;
      }
    }

    // Check if this is the main patient listing and change FROM and SELECT
    // clauses to improve query speed by removing unused joins
    const { isAllPatientsListing = false } = filterParams;
    const filters = createPatientFilters(filterParams);
    const { whereClauses, filterReplacements } = getWhereClausesAndReplacementsFromFilters(
      filters,
      filterParams,
    );

    const from = isAllPatientsListing
      ? `
      FROM patients
        LEFT JOIN (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY start_date DESC, id DESC) AS row_num
          FROM encounters
          WHERE end_date IS NULL
          AND deleted_at is NULL
        ) encounters
          ON (patients.id = encounters.patient_id AND encounters.row_num = 1)
        LEFT JOIN reference_data AS village
          ON (village.type = 'village' AND village.id = patients.village_id)
        LEFT JOIN (
          SELECT
            patient_id,
            ARRAY_AGG(value) AS secondary_ids
          FROM patient_secondary_ids
          GROUP BY patient_id
        ) psi
          ON (patients.id = psi.patient_id)
        LEFT JOIN patient_facilities
          ON (patient_facilities.patient_id = patients.id AND patient_facilities.facility_id = :facilityId)
      ${whereClauses && `WHERE ${whereClauses}`}
      `
      : `
      FROM patients
        LEFT JOIN (
            SELECT *, ROW_NUMBER() OVER (PARTITION BY patient_id ORDER BY start_date DESC, id DESC) AS row_num
            FROM encounters
            WHERE end_date IS NULL
            AND deleted_at is NULL
          ) encounters
          ON (patients.id = encounters.patient_id AND encounters.row_num = 1)
        LEFT JOIN users AS clinician
          ON clinician.id = encounters.examiner_id
        LEFT JOIN departments AS department
          ON (department.id = encounters.department_id)
        LEFT JOIN locations AS location
          ON (location.id = encounters.location_id)
        LEFT JOIN location_groups AS location_group
          ON (location_group.id = location.location_group_id)
        LEFT JOIN locations AS planned_location
          ON (planned_location.id = encounters.planned_location_id)
        LEFT JOIN location_groups AS planned_location_group
          ON (planned_location.location_group_id = planned_location_group.id)
        LEFT JOIN reference_data AS village
          ON (village.type = 'village' AND village.id = patients.village_id)
        LEFT JOIN (
            SELECT ed.encounter_id, jsonb_agg(json_build_object('id', rd.id, 'name', rd.name, 'code', rd.code)) diets
            FROM encounter_diets ed
            JOIN reference_data rd ON rd.id = ed.diet_id AND rd."type" = 'diet' AND rd.visibility_status = 'current'
            WHERE ed.deleted_at is NULL
            GROUP BY ed.encounter_id
        ) diets ON diets.encounter_id = encounters.id
        LEFT JOIN (
          SELECT
            patient_id,
            ARRAY_AGG(value) AS secondary_ids
          FROM patient_secondary_ids
          GROUP BY patient_id
        ) psi
          ON (patients.id = psi.patient_id)
        LEFT JOIN patient_facilities
          ON (patient_facilities.patient_id = patients.id AND patient_facilities.facility_id = :facilityId)
      ${whereClauses && `WHERE ${whereClauses}`}
    `;

    filterReplacements.facilityId = filterParams.facilityId;

    const countResult = await req.db.query(`SELECT COUNT(1) AS count ${from}`, {
      replacements: filterReplacements,
      type: QueryTypes.SELECT,
    });

    const count = parseInt(countResult[0].count, 10);

    if (count === 0 || filterParams.countOnly) {
      // save ourselves a query if 0 || user requested count only
      res.send({ data: [], count });
      return;
    }

    const select = isAllPatientsListing
      ? `
      SELECT
        patients.*,
        encounters.id AS encounter_id,
        encounters.encounter_type,
        village.id AS village_id,
        village.name AS village_name,
        patient_facilities.patient_id IS NOT NULL as marked_for_sync
      `
      : `
      SELECT
        patients.*,
        encounters.id AS encounter_id,
        encounters.encounter_type,
        diets.diets AS diets,
        clinician.display_name as clinician,
        department.id AS department_id,
        department.name AS department_name,
        location.id AS location_id,
        location.name AS location_name,
        location_group.name AS location_group_name,
        location_group.id AS location_group_id,
        planned_location_group.name AS planned_location_group_name,
        planned_location_group.id AS planned_location_group_id,
        planned_location.id AS planned_location_id,
        planned_location.name AS planned_location_name,
        encounters.planned_location_start_time,
        village.id AS village_id,
        village.name AS village_name,
        patient_facilities.patient_id IS NOT NULL as marked_for_sync
    `;

    const result = await req.db.query(
      `
        ${select}
        ${from}

        ORDER BY  ${
          filterSort && `${filterSort},`
        } ${sortKey} ${sortDirection}, ${secondarySearchTerm} NULLS LAST
        LIMIT :limit
        OFFSET :offset
      `,
      {
        replacements: {
          ...filterReplacements,
          ...filterSortReplacements,
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

    const { models, params, query } = req;
    const { Patient } = models;
    const { certType } = query;

    const patient = await Patient.findByPk(params.id);
    const labTests =
      certType === 'clearance'
        ? await patient.getCovidClearanceLabTests()
        : await patient.getCovidLabTests();

    res.json({ data: labTests, count: labTests.length });
  }),
);

patientRoute.post(
  '/:id/ipsRequest',
  asyncHandler(async (req, res) => {
    req.checkPermission('read', 'Patient');
    req.checkPermission('create', 'IPSRequest');

    const { models, params, body } = req;
    const { facilityId } = body;
    const { IPSRequest } = models;

    if (!req.body.email) {
      throw new InvalidParameterError('Missing email');
    }

    const ipsRequest = await IPSRequest.create({
      createdBy: req.user?.id,
      patientId: params.id,
      email: req.body.email,
      status: IPS_REQUEST_STATUSES.QUEUED,
    });

    res.send(dbRecordToResponse(ipsRequest, facilityId));
  }),
);

patientRoute.get(
  '/:id/ongoing-prescriptions',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Medication');

    const { models, params, query } = req;
    const patientId = params.id;
    const { PatientOngoingPrescription, Prescription } = models;
    const { order = 'ASC', orderBy = 'medication.name', page, rowsPerPage } = query;

    const medicationFilter = {};
    const canListSensitiveMedication = req.ability.can('list', 'SensitiveMedication');
    if (!canListSensitiveMedication) {
      medicationFilter['$medication.referenceDrug.is_sensitive$'] = false;
    }

    const baseQuery = {
      where: medicationFilter,
      include: [
        ...Prescription.getListReferenceAssociations(),
        {
          model: PatientOngoingPrescription,
          as: 'patientOngoingPrescription',
          where: { patientId },
        },
        {
          model: models.ReferenceData,
          as: 'medication',
          include: {
            model: models.ReferenceDrug,
            as: 'referenceDrug',
            attributes: ['referenceDataId', 'isSensitive'],
          },
        },
      ],
    };

    const ongoingPrescriptions = await Prescription.findAll({
      ...baseQuery,
      order: [
        [
          literal('CASE WHEN "discontinued" IS NULL OR "discontinued" = false THEN 1 ELSE 0 END'),
          'DESC',
        ],
        orderBy === 'route'
          ? [
              literal(
                `CASE "Prescription"."route" ${Object.entries(DRUG_ROUTE_LABELS)
                  .map(([value, label]) => `WHEN '${value}' THEN '${label.replace(/'/g, "''")}'`)
                  .join(' ')} ELSE "Prescription"."route" END`,
              ),
              order.toUpperCase(),
            ]
          : [...orderBy.split('.'), order.toUpperCase()],
      ],
      ...(page && rowsPerPage
        ? {
            limit: rowsPerPage,
            offset: page * rowsPerPage,
          }
        : {}),
    });

    const count = await Prescription.count({
      ...baseQuery,
    });

    res.json({ data: ongoingPrescriptions, count });
  }),
);

patientRoute.get(
  '/:id/last-inpatient-discharge-medications',
  asyncHandler(async (req, res) => {
    const {
      models: { Encounter, Discharge, Prescription, EncounterPrescription },
      params,
      query,
    } = req;
    const patientId = params.id;

    req.checkPermission('list', 'Medication');

    const { order = 'ASC', orderBy = 'medication.name' } = query;

    const lastInpatientEncounter = await Encounter.findOne({
      where: {
        patientId,
        encounterType: ENCOUNTER_TYPES.ADMISSION,
        endDate: {
          [Op.not]: null,
        },
      },
      include: [
        {
          model: Discharge,
          as: 'discharge',
          attributes: ['facilityName'],
        },
      ],
      order: [['endDate', 'DESC']],
    });

    if (!lastInpatientEncounter) {
      res.json({ data: [], count: 0 });
      return;
    }

    const medicationFilter = {};
    const canListSensitiveMedication = req.ability.can('list', 'SensitiveMedication');
    if (!canListSensitiveMedication) {
      medicationFilter['$medication.referenceDrug.is_sensitive$'] = false;
    }

    const dischargeMedications = await Prescription.findAll({
      where: medicationFilter,
      include: [
        ...Prescription.getListReferenceAssociations(),
        {
          model: EncounterPrescription,
          as: 'encounterPrescription',
          where: {
            isSelectedForDischarge: true,
            encounterId: lastInpatientEncounter.id,
          },
        },
        {
          model: req.models.ReferenceData,
          as: 'medication',
          include: {
            model: req.models.ReferenceDrug,
            as: 'referenceDrug',
            attributes: ['referenceDataId', 'isSensitive'],
          },
        },
      ],
      order: [[...orderBy.split('.'), order.toUpperCase()]],
    });

    res.json({
      data: dischargeMedications,
      count: dischargeMedications.length,
      lastInpatientEncounter,
    });
  }),
);

patientRoute.use(patientRelations);
patientRoute.use(patientVaccineRoutes);
patientRoute.use(patientDocumentMetadataRoutes);
patientRoute.use(patientInvoiceRoutes);
patientRoute.use(patientBirthData);
patientRoute.use(patientLocations);
patientRoute.use(patientProgramRegistration);
patientRoute.use('/programRegistration', patientProgramRegistrationConditions);
patientRoute.use(patientContact);
patientRoute.use(patientPortal);
patientRoute.use(patientInsurancePlans);

export { patientRoute as patient };
