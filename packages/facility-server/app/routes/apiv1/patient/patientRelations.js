import asyncHandler from 'express-async-handler';
import { Op, QueryTypes, Sequelize } from 'sequelize';

import { HIDDEN_VISIBILITY_STATUSES } from '@tamanu/constants/importable';
import { renameObjectKeys } from '@tamanu/utils/renameObjectKeys';
import { toArrayParam } from '@tamanu/utils/toArrayParam';
import {
  permissionCheckingRouter,
  runPaginatedQuery,
  simpleGetList,
} from '@tamanu/shared/utils/crudHelpers';
import { ENCOUNTER_TYPE_VALUES, ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';

import { patientSecondaryIdRoutes } from './patientSecondaryId';
import { patientDeath } from './patientDeath';
import { patientProfilePicture } from './patientProfilePicture';
import { deleteReferral, deleteSurveyResponse } from '../../../routeHandlers/deleteModel';
import { getPermittedSurveyIds } from '../../../utils/getPermittedSurveyIds';
import { makeFilter, getWhereClausesAndReplacementsFromFilters } from '../../../utils/query';

export const patientRelations = permissionCheckingRouter('read', 'Patient');

patientRelations.get(
  '/:id/encounters',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'Encounter');
    const {
      db,
      models: { Encounter },
      params,
      query,
    } = req;

    const {
      order = 'ASC',
      orderBy,
      open = false,
      encounterType,
      facilityId,
      dischargingClinicianId,
    } = query;

    const ENCOUNTER_SORT_KEYS = {
      startDate: 'start_date',
      encounterType: `
        CASE
          ${ENCOUNTER_TYPE_VALUES.map(
            value => `WHEN encounter_type = '${value}' THEN '${ENCOUNTER_TYPE_LABELS[value]}'`,
          ).join(' ')}
        END
      `,
      endDate: 'end_date',
      facilityName: 'facility_name',
      locationGroupName: 'location_group_name',
      dischargingClinicianName: 'discharging_clinician_name',
    };

    const sortKey = orderBy && ENCOUNTER_SORT_KEYS[orderBy];
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const sortExpression =
      sortKey &&
      (orderBy === 'dischargingClinicianName'
        ? `${sortKey} ${sortDirection} NULLS LAST`
        : `${sortKey} ${sortDirection}`);

    const searchFilters = [
      makeFilter(encounterType, 'encounters.encounter_type = :encounterType'),
      makeFilter(facilityId, 'locations.facility_id = :facilityId'),
      makeFilter(dischargingClinicianId, 'dischargingClinician.id = :dischargingClinicianId'),
    ];

    const { whereClauses, filterReplacements } = getWhereClausesAndReplacementsFromFilters(
      searchFilters,
      { encounterType, facilityId, dischargingClinicianId },
    );
    const searchWhereClause = whereClauses ? `AND ${whereClauses}` : '';

    const fromClause = `
      FROM
        encounters
        INNER JOIN locations
          ON encounters.location_id = locations.id
        INNER JOIN facilities
          ON locations.facility_id = facilities.id
        LEFT JOIN location_groups
          ON location_groups.id = locations.location_group_id
        LEFT JOIN LATERAL (
          SELECT discharger_id
          FROM discharges
          WHERE discharges.encounter_id = encounters.id
            AND deleted_at IS NULL
          ORDER BY (discharger_id IS NULL), discharger_id
          LIMIT 1
        ) AS discharge ON true
        LEFT JOIN users AS dischargingClinician
          ON dischargingClinician.id = discharge.discharger_id`;

    const whereClause = `
      WHERE
        patient_id = :patientId
        AND encounters.deleted_at IS NULL
        AND locations.deleted_at IS NULL
        AND facilities.deleted_at IS NULL
        AND location_groups.deleted_at IS NULL
        ${open ? 'AND encounters.end_date IS NULL' : ''}
        ${searchWhereClause}`;

    const { count, data } = await runPaginatedQuery(
      db,
      Encounter,
      `
        SELECT COUNT(1) as count
        ${fromClause}
        ${whereClause}
      `,
      `
        SELECT
          encounters.*,
          locations.facility_id AS facility_id,
          facilities.name AS facility_name,
          location_groups.name AS location_group_name,
          location_groups.id AS location_group_id,
          dischargingClinician.display_name AS discharging_clinician_name
        ${fromClause}
        ${whereClause}
        ${sortExpression ? `ORDER BY ${sortExpression}` : ''}
      `,
      { patientId: params.id, ...filterReplacements },
      query,
    );

    res.send({
      count: parseInt(count, 10),
      data,
    });
  }),
);

patientRelations.get('/:id/issues', simpleGetList('PatientIssue', 'patientId'));
patientRelations.get('/:id/conditions', simpleGetList('PatientCondition', 'patientId'));
patientRelations.get('/:id/allergies', simpleGetList('PatientAllergy', 'patientId'));
patientRelations.get('/:id/familyHistory', simpleGetList('PatientFamilyHistory', 'patientId'));
patientRelations.get('/:id/carePlans', simpleGetList('PatientCarePlan', 'patientId'));

patientRelations.get(
  '/:id/additionalData',
  asyncHandler(async (req, res) => {
    const {
      models,
      params,
      query: { facilityId },
    } = req;

    req.checkPermission('read', 'Patient');

    const additionalDataRecord = await models.PatientAdditionalData.findOne({
      where: { patientId: params.id },
      include: models.PatientAdditionalData.getFullReferenceAssociations(),
    });

    const recordData = additionalDataRecord ? additionalDataRecord.toJSON() : {};

    if (additionalDataRecord) {
      await req.audit.access({
        recordId: additionalDataRecord.id,
        frontEndContext: params,
        model: models.PatientAdditionalData,
        facilityId,
      });
    }

    res.send(recordData);
  }),
);

patientRelations.get(
  '/:id/fields',
  asyncHandler(async (req, res) => {
    const { params } = req;
    req.checkPermission('read', 'Patient');
    const values = await req.db.query(
      `
        SELECT
          d.id AS "definitionId",
          v.value
        FROM patient_field_definitions d
        JOIN patient_field_values v
        ON v.definition_id = d.id
        WHERE v.patient_id = :patientId
        AND d.visibility_status NOT IN (:hiddenStatuses)
        AND d.deleted_at IS NULL
        AND v.deleted_at IS NULL;
      `,
      {
        replacements: {
          patientId: params.id,
          hiddenStatuses: HIDDEN_VISIBILITY_STATUSES,
        },
        type: QueryTypes.SELECT,
      },
    );
    res.send({
      data: values.reduce(
        (memo, { definitionId, value }) => ({ ...memo, [definitionId]: value }),
        {},
      ),
    });
  }),
);

const REFERRAL_SORT_KEYS = {
  date: Sequelize.literal('"surveyResponse.submissionDate"'),
  referralType: Sequelize.col('surveyResponse.survey.name'),
  status: Sequelize.col('status'),
};

patientRelations.get(
  '/:id/referrals',
  asyncHandler(async (req, res) => {
    const { models, params, query } = req;
    const { order = 'asc', orderBy = 'date' } = query;
    req.checkPermission('list', 'SurveyResponse');
    const sortKey = REFERRAL_SORT_KEYS[orderBy] || REFERRAL_SORT_KEYS.date;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const permittedSurveyIds = await getPermittedSurveyIds(req, models);

    if (!permittedSurveyIds.length) {
      res.send({
        data: [],
        count: 0,
      });
      return;
    }

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
          attributes: {
            include: [
              [
                Sequelize.literal(
                  `COALESCE((SELECT
                    sra.body
                  FROM survey_response_answers sra
                   LEFT JOIN program_data_elements pde ON sra.data_element_id = pde.id
                  WHERE "surveyResponse".id = sra.response_id
                    AND pde.type = 'SubmissionDate'), "surveyResponse".end_time)`,
                ),
                'submissionDate',
              ],
            ],
          },
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
      where: {
        '$surveyResponse.survey_id$': {
          [Op.in]: permittedSurveyIds,
        },
      },
      order: [[sortKey, sortDirection]],
    });

    res.send({ count: patientReferrals.length, data: patientReferrals });
  }),
);

patientRelations.delete('/:id/referrals/:referralId', deleteReferral);

const PROGRAM_RESPONSE_SORT_KEYS = {
  endTime: 'end_time',
  submittedBy: 'submitted_by',
  programName: 'program_name',
  surveyName: 'survey_name',
  resultText: 'result_text',
};

patientRelations.get(
  '/:id/programResponses',
  asyncHandler(async (req, res) => {
    const { db, models, params, query } = req;
    req.checkPermission('list', 'SurveyResponse');
    const patientId = params.id;
    const {
      surveyId,
      programId,
      procedureId,
      surveyType = 'programs',
      order = 'asc',
      orderBy = 'endTime',
    } = query;
    const sortKey = PROGRAM_RESPONSE_SORT_KEYS[orderBy] || PROGRAM_RESPONSE_SORT_KEYS.endTime;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const permittedSurveyIds = await getPermittedSurveyIds(req, models);

    if (!permittedSurveyIds.length) {
      res.send({
        data: [],
        count: 0,
      });
      return;
    }

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
          ${procedureId ? 'LEFT JOIN procedure_survey_responses ON (survey_responses.id = procedure_survey_responses.survey_response_id)' : ''}
        WHERE
          encounters.patient_id = :patientId
          AND surveys.survey_type = :surveyType
          AND survey_responses.deleted_at IS NULL
          ${surveyId ? 'AND surveys.id = :surveyId' : 'AND surveys.id IN (:surveyIds)'}
          ${procedureId ? 'AND procedure_survey_responses.procedure_id = :procedureId' : 'AND survey_responses.id NOT IN (SELECT survey_response_id FROM procedure_survey_responses WHERE deleted_at IS NULL)'}
      `,
      `
        SELECT
          survey_responses.*,
          surveys.id as survey_id,
          surveys.name as survey_name,
          encounters.examiner_id,
          COALESCE(survey_user.display_name, encounter_user.display_name) as submitted_by,
          programs.name as program_name,
          survey_responses.edited_time IS NOT NULL AS is_edited
        FROM
          survey_responses
          LEFT JOIN encounters
            ON (survey_responses.encounter_id = encounters.id)
          LEFT JOIN surveys
            ON (survey_responses.survey_id = surveys.id)
          LEFT JOIN users encounter_user
            ON (encounter_user.id = encounters.examiner_id)
          LEFT JOIN users survey_user
            ON (survey_user.id = survey_responses.user_id)
          LEFT JOIN programs
            ON (programs.id = surveys.program_id)
          ${procedureId ? 'LEFT JOIN procedure_survey_responses ON (survey_responses.id = procedure_survey_responses.survey_response_id)' : ''}
        WHERE encounters.patient_id = :patientId
          AND encounters.deleted_at is null
          AND surveys.survey_type = :surveyType
          AND survey_responses.deleted_at IS NULL
          ${surveyId ? 'AND surveys.id = :surveyId' : 'AND surveys.id IN (:surveyIds)'}
          ${programId ? 'AND programs.id = :programId' : ''}
          ${procedureId ? 'AND procedure_survey_responses.procedure_id = :procedureId' : 'AND survey_responses.id NOT IN (SELECT survey_response_id FROM procedure_survey_responses)'}
        ORDER BY ${sortKey} ${sortDirection}
      `,
      { patientId, surveyId, surveyIds: permittedSurveyIds, programId, procedureId, surveyType },
      query,
    );

    res.send({
      count: parseInt(count, 10),
      data,
    });
  }),
);

patientRelations.get(
  '/:id/labTestResults',
  asyncHandler(async (req, res) => {
    req.checkPermission('list', 'LabTest');
    const canListSensitive = req.ability.can('list', 'SensitiveLabRequest');
    const {
      db,
      models: { LabTest },
      params,
      query,
    } = req;

    const { categoryId, status = 'published' } = query;
    const panelIds = toArrayParam(query.panelIds);
    const testIds = toArrayParam(query.testIds);

    // Test category and Test or panel are mutually exclusive. A category lists every test in it
    // as a flat A–Z list; test/panel picks drive a grouped view the frontend assembles from the
    // `groups` metadata returned below. With no filter at all (the initial load that checks whether
    // the patient has any results), every published result is returned.
    let selectionClause = '';
    // The same filter, expressed against lab_tests/lab_requests, narrows the changelog scan in the
    // edited-entry CTE to just the tests being displayed instead of the patient's whole history.
    let cteSelectionClause = '';
    const replacements = { patientId: params.id, status, canListSensitive };

    // Panels the user picked contribute their member tests (in the panel's configured order) to
    // the set of results fetched, and the grouping metadata the frontend renders headings from.
    let panelMembers = [];
    if (categoryId) {
      replacements.categoryId = categoryId;
      selectionClause = 'AND lab_requests.lab_test_category_id = :categoryId';
      cteSelectionClause = 'AND lab_requests.lab_test_category_id = :categoryId';
    } else if (panelIds.length || testIds.length) {
      if (panelIds.length) {
        panelMembers = await db.query(
          `SELECT
             lab_test_panels.id AS panel_id,
             lab_test_panels.name AS panel_name,
             lab_test_panel_lab_test_types.lab_test_type_id AS test_type_id,
             lab_test_panel_lab_test_types."order" AS member_order
           FROM lab_test_panels
           INNER JOIN lab_test_panel_lab_test_types
             ON lab_test_panel_lab_test_types.lab_test_panel_id = lab_test_panels.id
           WHERE lab_test_panels.id IN (:panelIds)
           ORDER BY lab_test_panels.name ASC, lab_test_panel_lab_test_types."order" ASC`,
          { replacements: { panelIds }, type: QueryTypes.SELECT },
        );
      }
      const panelMemberTypeIds = [...new Set(panelMembers.map(member => member.test_type_id))];
      const testTypeIds = [...new Set([...testIds, ...panelMemberTypeIds])];
      // An empty IN () is invalid SQL; a single NULL matches nothing, which is the intended result.
      replacements.testTypeIds = testTypeIds.length ? testTypeIds : [null];
      selectionClause = 'AND lab_test_types.id IN (:testTypeIds)';
      cteSelectionClause = 'AND lab_tests.lab_test_type_id IN (:testTypeIds)';
    }

    const results = await db.query(
      `WITH edited_tests AS (
    SELECT
      record_id,
      COUNT(DISTINCT (record_data->>'result')) >= 2 AS is_edited
    FROM logs.changes
    WHERE table_schema = 'public'
      AND table_name = 'lab_tests'
      AND record_data->>'result' IS NOT NULL
      AND TRIM(record_data->>'result') != ''
      AND record_id IN (
        SELECT lab_tests.id::text
        FROM lab_tests
        INNER JOIN lab_requests ON lab_tests.lab_request_id = lab_requests.id
        WHERE lab_requests.encounter_id IN (
          SELECT id FROM encounters WHERE patient_id = :patientId AND deleted_at IS NULL
        )
        ${cteSelectionClause}
      )
    GROUP BY record_id
  )
  SELECT
    reference_data.name AS test_category,
    lab_test_types.name AS test_type,
    lab_test_types.options AS test_options,
    lab_test_types.id AS test_type_id,
    FIRST(lab_test_types.unit) AS unit,
    FIRST(lab_test_types.range_text) AS range_text,
    JSONB_BUILD_OBJECT(
      'male', JSONB_BUILD_OBJECT(
        'min', MIN(lab_test_types.male_min),
        'max', MAX(lab_test_types.male_max)
      ),
      'female', JSONB_BUILD_OBJECT(
        'min', MIN(lab_test_types.female_min),
        'max', MAX(lab_test_types.female_max)
      )
    ) AS normal_ranges,
    JSONB_OBJECT_AGG(
      lab_requests.sample_time, JSONB_BUILD_OBJECT(
        'result', lab_tests.result,
        'id', lab_tests.id,
        'isEdited', COALESCE(edited_tests.is_edited, FALSE),
        'referenceRangeMin', lab_tests.reference_range_min,
        'referenceRangeMax', lab_tests.reference_range_max,
        'referenceRangeText', lab_tests.reference_range_text
      )
    ) AS results
  FROM
    lab_tests
  INNER JOIN
    lab_requests
  ON
    lab_tests.lab_request_id = lab_requests.id
  INNER JOIN
    lab_test_types
  ON
    lab_tests.lab_test_type_id = lab_test_types.id
  INNER JOIN
    reference_data
  ON
    lab_test_types.lab_test_category_id = reference_data.id
  LEFT JOIN
    edited_tests
  ON
    edited_tests.record_id = lab_tests.id::text
  WHERE
  encounter_id IN (
      SELECT id
      FROM
        encounters
      WHERE
        patient_id = :patientId
        AND deleted_at IS NULL
    )
  AND lab_requests.status = :status
  AND lab_requests.sample_time IS NOT NULL
  AND lab_requests.deleted_at IS NULL
  AND CASE WHEN :canListSensitive IS TRUE
    THEN TRUE
    ELSE lab_test_types.is_sensitive IS FALSE
    END
  ${selectionClause}
  GROUP BY
    test_category, test_type, test_options, test_type_id
  ORDER BY
    test_type ASC`,
      {
        replacements,
        model: LabTest,
        type: QueryTypes.SELECT,
        mapToModel: true,
      },
    );

    const formattedData = results.map(x => renameObjectKeys(x.forResponse()));

    // Group metadata for the picked panels: each panel, A–Z, with its member tests (in configured
    // order) that the patient actually has results for. The frontend renders a heading row per
    // group and the "Individual tests" group from the testIds it picked.
    const presentTypeIds = new Set(formattedData.map(row => row.testTypeId));
    const groupsById = new Map();
    for (const member of panelMembers) {
      if (!presentTypeIds.has(member.test_type_id)) continue;
      if (!groupsById.has(member.panel_id)) {
        groupsById.set(member.panel_id, {
          id: member.panel_id,
          name: member.panel_name,
          testTypeIds: [],
        });
      }
      groupsById.get(member.panel_id).testTypeIds.push(member.test_type_id);
    }

    res.send({
      count: results.length,
      data: formattedData,
      groups: [...groupsById.values()],
    });
  }),
);

patientRelations.delete('/:id/programResponses/:surveyResponseId', deleteSurveyResponse);

patientRelations.use(patientProfilePicture);
patientRelations.use(patientDeath);
patientRelations.use(patientSecondaryIdRoutes);
