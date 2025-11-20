import express from 'express';
import asyncHandler from 'express-async-handler';
import { Op, QueryTypes, Sequelize, literal } from 'sequelize';
import { subject } from '@casl/ability';
import {
  PROGRAM_REGISTRY_CONDITION_CATEGORIES,
  REGISTRATION_STATUSES,
  VISIBILITY_STATUSES,
  SURVEY_TYPES,
  CHARTING_DATA_ELEMENT_IDS,
} from '@tamanu/constants';
import { deepRenameObjectKeys } from '@tamanu/utils/renameObjectKeys';
import { simpleGet, simpleGetList } from '@tamanu/shared/utils/crudHelpers';
import { NotFoundError } from '@tamanu/errors';

import {
  makeFilter,
  makeSimpleTextFilterFactory,
  makeSubstringTextFilterFactory,
} from '../../utils/query';
import {
  fetchAnswersWithHistory,
  fetchGraphData,
  fetchChartInstances,
  deleteChartInstance,
} from '../../routeHandlers/charts';

export const programRegistry = express.Router();

programRegistry.get('/:id', simpleGet('ProgramRegistry'));

programRegistry.get(
  '/$',
  asyncHandler(async (req, res) => {
    const { models, query } = req;
    req.checkPermission('list', 'ProgramRegistry');

    if (query.excludePatientId) {
      req.checkPermission('read', 'Patient');
      req.checkPermission('read', 'PatientProgramRegistration');
    }

    const { ProgramRegistry } = models;

    const patientIdExclusion = query.excludePatientId
      ? {
          id: {
            [Op.notIn]: Sequelize.literal(
              `(
                SELECT most_recent_registrations.id
                FROM (
                    SELECT DISTINCT ON (pr.id) pr.id, ppr.registration_status
                    from program_registries pr
                    INNER JOIN patient_program_registrations ppr
                    ON ppr.program_registry_id = pr.id
                    WHERE ppr.patient_id = :excludePatientId
                    ORDER BY pr.id DESC, ppr.date DESC, ppr.id DESC
                ) most_recent_registrations
                WHERE most_recent_registrations.registration_status != :error
              )`,
            ),
          },
        }
      : {};

    const baseQueryOptions = {
      where: {
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        ...patientIdExclusion,
      },
      replacements: {
        error: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
        excludePatientId: query.excludePatientId,
      },
    };

    const count = await ProgramRegistry.count(baseQueryOptions);

    const { order = 'ASC', orderBy = 'createdAt', rowsPerPage, page } = query;
    const objects = await ProgramRegistry.findAll({
      ...baseQueryOptions,
      include: ProgramRegistry.getListReferenceAssociations(models),
      order: orderBy ? [[...orderBy.split('.'), order.toUpperCase()]] : undefined,
      limit: rowsPerPage,
      offset: page && rowsPerPage ? page * rowsPerPage : undefined,
    });

    const filteredObjects = objects.filter(programRegistry =>
      req.ability.can('list', programRegistry),
    );
    const filteredData = filteredObjects.map(x => x.forResponse());
    const filteredCount =
      objects.length !== filteredObjects.length ? filteredObjects.length : count;

    res.send({ count: filteredCount, data: filteredData });
  }),
);

programRegistry.get(
  '/:id/conditions',
  simpleGetList('ProgramRegistryCondition', 'programRegistryId', {
    additionalFilters: {
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  }),
);

programRegistry.get(
  '/:id/conditionCategories',
  simpleGetList('ProgramRegistryConditionCategory', 'programRegistryId', {
    additionalFilters: {
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    },
  }),
);

programRegistry.get(
  '/:id/registrations',
  asyncHandler(async (req, res) => {
    const {
      models: { PatientProgramRegistration },
      params: { id: programRegistryId },
      query,
    } = req;
    req.checkPermission('read', subject('ProgramRegistry', { id: programRegistryId }));
    req.checkPermission('read', 'Patient');
    req.checkPermission('list', 'PatientProgramRegistration');

    const {
      order = 'ASC',
      orderBy = 'displayId',
      rowsPerPage = 10,
      page = 0,
      ...filterParams
    } = query;

    const makeSimpleTextFilter = makeSimpleTextFilterFactory(filterParams);
    const makePartialTextFilter = makeSubstringTextFilterFactory(filterParams);
    const filters = [
      // Patient filters
      makePartialTextFilter('displayId', 'patient.display_id'),
      makeSimpleTextFilter('firstName', 'patient.first_name'),
      makeSimpleTextFilter('lastName', 'patient.last_name'),
      makeFilter(filterParams.sex, 'patient.sex = :sex', ({ sex }) => ({
        sex: sex.toLowerCase(),
      })),
      makeFilter(filterParams.dateOfBirth, `patient.date_of_birth = :dateOfBirth`),
      makeFilter(filterParams.homeVillage, `patient.village_id = :homeVillage`),
      makeFilter(filterParams.divisionId, `pad.division_id = :divisionId`),
      makeFilter(filterParams.subdivisionId, `pad.subdivision_id = :subdivisionId`),
      makeFilter(
        !filterParams.deceased || filterParams.deceased === 'false',
        'patient.date_of_death IS NULL',
      ),

      // Registration filters
      makeFilter(
        filterParams.registeringFacilityId,
        'mrr.registering_facility_id = :registeringFacilityId',
      ),
      makeFilter(
        filterParams.clinicalStatus,
        'mrr.clinical_status_id = any(array[:clinicalStatus])',
      ),
      makeFilter(
        filterParams.currentlyIn,
        'mrr.village_id = :currentlyIn OR mrr.facility_id = :currentlyIn',
      ),
      makeFilter(
        filterParams.programRegistryCondition,
        // Essentially the `<@` operator checks that the json on the left is contained in the json on the right
        // so we build up a string like '["A_condition_name"]' and cast it to json before checking membership.
        `(select array_agg(prc2.name) from program_registry_conditions prc2 where prc2.id = any(array[:programRegistryCondition])) && conditions.condition_list`,
      ),
      makeFilter(true, 'mrr.registration_status != :error_status', () => ({
        error_status: REGISTRATION_STATUSES.RECORDED_IN_ERROR,
      })),
      makeFilter(
        !filterParams.removed || filterParams.removed === 'false',
        'mrr.registration_status = :active_status',
        () => ({
          active_status: REGISTRATION_STATUSES.ACTIVE,
        }),
      ),
    ].filter(f => f);

    const whereClauses = filters.map(f => f.sql).join(' AND ');

    const filterReplacements = filters
      .filter(f => f.transform)
      .reduce(
        (current, { transform }) => ({
          ...current,
          ...transform(current),
        }),
        filterParams,
      );

    const withClause = `
      with
        most_recent_registrations as (
          SELECT *
          FROM (
            SELECT
              *,
              ROW_NUMBER() OVER (PARTITION BY patient_id, program_registry_id ORDER BY date DESC, id DESC) AS row_num
            FROM patient_program_registrations
            WHERE program_registry_id = :programRegistryId
            AND deleted_at IS NULL
          ) n
          WHERE n.row_num = 1
        ),
        conditions as (
          SELECT patient_program_registration_id,  array_agg(prc."name") condition_list, jsonb_agg(jsonb_build_object('id', prc.id, 'name', prc."name")) condition_record_list
          FROM patient_program_registration_conditions pprc
          JOIN program_registry_conditions prc ON pprc.program_registry_condition_id = prc.id
          JOIN patient_program_registrations ppr ON ppr.id = pprc.patient_program_registration_id
          JOIN program_registry_condition_categories prcc ON prcc.id = pprc.program_registry_condition_category_id
          WHERE ppr.program_registry_id = :programRegistryId
          AND pprc.deleted_at IS NULL
          AND prcc.code NOT IN (:excludedCategories)
          GROUP BY patient_program_registration_id
        )
    `;
    const from = `
      FROM most_recent_registrations mrr
        LEFT JOIN patients patient
          ON patient.id = mrr.patient_id
        LEFT JOIN reference_data patient_village
          ON patient.village_id = patient_village.id
        LEFT JOIN reference_data currently_at_village
          ON mrr.village_id = currently_at_village.id
        LEFT JOIN facilities currently_at_facility
          ON mrr.facility_id = currently_at_facility.id
        LEFT JOIN facilities registering_facility
          ON mrr.registering_facility_id = registering_facility.id
        LEFT JOIN conditions
          ON conditions.patient_program_registration_id = mrr.id
        LEFT JOIN program_registry_clinical_statuses status
          ON mrr.clinical_status_id = status.id
        LEFT JOIN program_registries program_registry
          ON mrr.program_registry_id = program_registry.id
        LEFT JOIN users clinician
          ON mrr.clinician_id = clinician.id
        LEFT JOIN patient_additional_data pad
          ON pad.patient_id = patient.id
        LEFT JOIN reference_data division
          ON division.id = pad.division_id
        LEFT JOIN reference_data subdivision
          ON subdivision.id = pad.subdivision_id
      ${whereClauses && `WHERE ${whereClauses}`}
    `;

    const excludedCategories = [
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.DISPROVEN,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.RECORDED_IN_ERROR,
      PROGRAM_REGISTRY_CONDITION_CATEGORIES.RESOLVED,
    ];

    const countResult = await req.db.query(`${withClause} SELECT COUNT(1) AS count ${from}`, {
      replacements: {
        ...filterReplacements,
        programRegistryId,
        excludedCategories,
      },
      type: QueryTypes.SELECT,
    });

    const count = parseInt(countResult[0].count, 10);

    if (count === 0) {
      // save ourselves a query
      res.send({ data: [], count });
      return;
    }
    const sortKeys = {
      displayId: 'patient.display_id',
      firstName: 'UPPER(patient.first_name)',
      lastName: 'UPPER(patient.last_name)',
      dateOfBirth: 'patient.date_of_birth',
      homeVillage: 'UPPER(patient_village.name)',
      registeringFacility: 'registering_facility.name',
      currentlyIn: 'COALESCE(UPPER(currently_at_village.name), UPPER(currently_at_facility.name))',
      clinicalStatus: 'mrr.clinical_status_id',
      divisionName: 'patient.division.name',
      subdivisionName: 'patient.subdivision.name',
    };

    const sortKey = sortKeys[orderBy] ?? sortKeys.displayId;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const nullPosition = sortDirection === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST';

    const result = await req.db.query(
      `
      ${withClause}
      select
        patient.id AS "patient.id",
        --
        -- Details for the table
        mrr.id as "id",
        patient.id AS "patient_id",
        patient.display_id AS "patient.display_id",
        patient.first_name AS "patient.first_name",
        patient.last_name AS "patient.last_name",
        patient.date_of_birth AS "patient.date_of_birth",
        patient.date_of_death AS "patient.date_of_death",
        patient.sex AS "patient.sex",
        division.name AS "patient.division.name",
        subdivision.name AS "patient.subdivision.name",
        patient_village.name AS "patient.village.name",
        currently_at_village.name as "village.name",
        currently_at_facility.name as "facility.name",
        registering_facility.name as "registering_facility.name",
        registering_facility.id as "registering_facility_id",
        conditions.condition_record_list as "conditions",
        status.name as "clinical_status.name",
        status.color as "clinical_status.color",
        status.id as "clinical_status.id",
        program_registry.currently_at_type as "program_registry.currently_at_type",
        program_registry.name as "program_registry.name",
        program_registry.id as "program_registry_id",
        clinician.display_name as "clinician.display_name",
        mrr.date as "date",
        --
        -- Details for filtering/ordering
        patient.date_of_death as "patient.date_of_death",
        mrr.registration_status as "registration_status"
      ${from}

      ORDER BY ${sortKey} ${sortDirection}${nullPosition ? ` ${nullPosition}` : ''}
      LIMIT :limit
      OFFSET :offset
      `,
      {
        replacements: {
          ...filterReplacements,
          excludedCategories,
          programRegistryId,
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          sortKey,
          sortDirection,
        },
        // The combination of these two parameters allow mapping the query results
        // to nested models
        model: PatientProgramRegistration,
        mapToModel: true,
        nest: true,
        raw: true,
        type: QueryTypes.SELECT,
      },
    );

    const forResponse = result.map(deepRenameObjectKeys);
    res.send({
      data: forResponse,
      count,
    });
  }),
);

// Get list of charts available for a specific program registry
programRegistry.get(
  '/:id/linkedCharts',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { id: programRegistryId } = params;
    const patientId = query?.patientId;

    req.checkPermission('list', subject('ProgramRegistry', { id: programRegistryId }));
    req.checkPermission('list', 'Survey');

    const registry = await models.ProgramRegistry.findByPk(programRegistryId);
    if (!registry) {
      throw new NotFoundError('Program registry not found');
    }

    if (patientId) {
      const patient = await models.Patient.findByPk(patientId);
      if (!patient) {
        throw new NotFoundError('Patient not found');
      }
    }

    const charts = await models.Survey.findAll({
      where: {
        programId: registry.programId,
        [Op.or]: [
          {
            surveyType: {
              [Op.in]: [SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART],
            },
            visibilityStatus: VISIBILITY_STATUSES.CURRENT,
          },
          {
            [Op.and]: [
              {
                surveyType: {
                  [Op.in]: [SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART],
                },
                visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
              },
              literal( `
                EXISTS (
                  SELECT 1 FROM survey_responses sr
                  JOIN survey_response_answers sra ON sra.response_id = sr.id
                  JOIN encounters e ON e.id = sr.encounter_id
                  WHERE sr.survey_id = "Survey".id
                    AND sr.deleted_at IS NULL
                    ${patientId ? 'AND e.patient_id = :patientId' : ''}
                )
              `),
            ],
          },
          {
            surveyType: SURVEY_TYPES.COMPLEX_CHART_CORE,
          },
        ],
      },
      order: [['name', 'ASC']],
      ...(patientId && { replacements: { patientId } }),
    });

    // check permissions for each chart
    const permittedCharts = charts.filter(chart =>
      req.ability.can('list', subject('Charting', { id: chart.id })),
    );

    res.send({
      data: permittedCharts.map(c => c.forResponse()),
      count: permittedCharts.length,
    });
  }),
);

programRegistry.get(
  '/patient/:patientId/initialChart',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { patientId } = params;
    const { programRegistryId } = query;

    req.checkPermission('read', 'Patient');

    let surveyWhereClause = {
      surveyType: [SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART],
    };

    if (programRegistryId) {
      const registry = await models.ProgramRegistry.findByPk(programRegistryId);
      if (!registry) {
        throw new NotFoundError('Program registry not found');
      }

      surveyWhereClause = {
        ...surveyWhereClause,
        programId: registry.programId,
      };
    }

    // Get all chart surveys that have responses for this patient
    // SurveyResponses are linked to encounters, which are linked to patients
    const chartSurvey = await models.SurveyResponse.findAll({
      attributes: [],
      include: [
        {
          attributes: [],
          required: true,
          model: models.Encounter,
          as: 'encounter',
          where: { patientId },
        },
        {
          attributes: ['id', 'name'],
          required: true,
          model: models.Survey,
          as: 'survey',
          where: surveyWhereClause,
        },
      ],
      order: [['survey', 'name', 'ASC']],
      group: ['survey.id', 'survey.name'],
      raw: true,
    });
    req.flagPermissionChecked();
    const allowedSurvey = chartSurvey.find(response =>
      req.ability.can('list', subject('Charting', { id: response['survey.id'] })),
    );

    res.send({
      data: allowedSurvey
        ? { survey: { id: allowedSurvey['survey.id'], name: allowedSurvey['survey.name'] } }
        : undefined,
    });
  }),
);

programRegistry.get(
  '/patient/:patientId/charts/:surveyId',
  fetchAnswersWithHistory({
    permissionAction: 'read',
    permissionNoun: 'Charting',
  }),
);

programRegistry.get(
  '/patient/:patientId/graphData/charts/:dataElementId',
  fetchGraphData({
    permissionAction: 'read',
    permissionNoun: 'Charting',
    dateDataElementId: CHARTING_DATA_ELEMENT_IDS.dateRecorded,
  }),
);

programRegistry.get(
  '/patient/:patientId/charts/:chartSurveyId/chartInstances',
  fetchChartInstances(),
);

programRegistry.delete(
  '/patient/:patientId/chartInstances/:chartInstanceResponseId',
  deleteChartInstance(),
);
