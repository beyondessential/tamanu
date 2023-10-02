import asyncHandler from 'express-async-handler';
import { QueryTypes, Sequelize } from 'sequelize';

import { getPatientAdditionalData } from 'shared/utils';
import { HIDDEN_VISIBILITY_STATUSES } from '@tamanu/constants/importable';

import { renameObjectKeys } from '@tamanu/shared/utils/renameObjectKeys';
import {
  simpleGetList,
  permissionCheckingRouter,
  runPaginatedQuery,
} from 'shared/utils/crudHelpers';
import { patientSecondaryIdRoutes } from './patientSecondaryId';
import { patientDeath } from './patientDeath';
import { patientProfilePicture } from './patientProfilePicture';

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

    const { order = 'ASC', orderBy, open = false } = query;

    const ENCOUNTER_SORT_KEYS = {
      startDate: 'start_date',
      endDate: 'end_date',
      facilityName: 'facility_name',
      locationGroupName: 'location_group_name',
    };

    const sortKey = orderBy && ENCOUNTER_SORT_KEYS[orderBy];
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const { count, data } = await runPaginatedQuery(
      db,
      Encounter,
      `
        SELECT COUNT(1) as count
        FROM
          encounters
        WHERE
          patient_id = :patientId
          ${open ? 'AND end_date IS NULL' : ''}
      `,
      `
        SELECT
          encounters.*,
          locations.facility_id AS facility_id,
          facilities.name AS facility_name,
          location_groups.name AS location_group_name
        FROM
          encounters
          INNER JOIN locations
            ON encounters.location_id = locations.id
          INNER JOIN facilities
            ON locations.facility_id = facilities.id
          LEFT JOIN location_groups
            ON location_groups.id = locations.location_group_id
        WHERE
          patient_id = :patientId
          ${open ? 'AND end_date IS NULL' : ''}
        ${sortKey ? `ORDER BY ${sortKey} ${sortDirection}` : ''}
      `,
      { patientId: params.id },
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
    const streetVillage = await getPatientAdditionalData(models, params.id, 'streetVillage');
    const cityTown = await getPatientAdditionalData(models, params.id, 'cityTown');
    const countryId = await getPatientAdditionalData(models, params.id, 'countryId');
    const nationality = nationalityId
      ? await models.ReferenceData.findByPk(nationalityId)
      : undefined;
    const country = countryId ? await models.ReferenceData.findByPk(countryId) : undefined;

    const recordData = additionalDataRecord ? additionalDataRecord.toJSON() : {};
    res.send({
      ...recordData,
      passport,
      nationality,
      nationalityId,
      streetVillage,
      cityTown,
      country,
    });
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
        AND d.visibility_status NOT IN (:hiddenStatuses);
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
      order: [[sortKey, sortDirection]],
    });

    res.send({ count: patientReferrals.length, data: patientReferrals });
  }),
);

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
      surveyType = 'programs',
      order = 'asc',
      orderBy = 'endTime',
    } = query;
    const sortKey = PROGRAM_RESPONSE_SORT_KEYS[orderBy] || PROGRAM_RESPONSE_SORT_KEYS.endTime;
    const sortDirection = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
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
          COALESCE(survey_user.display_name, encounter_user.display_name) as submitted_by,
          programs.name as program_name
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
        WHERE
          encounters.patient_id = :patientId
          AND surveys.survey_type = :surveyType
          ${surveyId ? 'AND surveys.id = :surveyId' : ''}
          ${programId ? 'AND programs.id = :programId' : ''}
        ORDER BY ${sortKey} ${sortDirection}
      `,
      { patientId, surveyId, programId, surveyType },
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
    const {
      db,
      models: { LabTest },
      params,
      query,
    } = req;

    const { categoryId, panelId, status = 'published' } = query;

    const results = await db.query(
      `SELECT
    reference_data.name AS test_category,
    lab_test_types.name AS test_type,
    FIRST(lab_test_types.unit) AS unit,
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
        'id', lab_tests.id
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
  WHERE
  encounter_id IN (
      SELECT id
      FROM
        encounters
      WHERE
        patient_id = :patientId
    )
  AND lab_requests.status = :status
  AND lab_requests.sample_time IS NOT NULL
  ${categoryId ? 'AND lab_requests.lab_test_category_id = :categoryId' : ''}
  ${
    panelId
      ? `AND lab_test_type_id IN (
         SELECT lab_test_type_id
         FROM
           lab_test_panel_lab_test_types
         WHERE
           lab_test_panel_id = :panelId
       )`
      : ''
  }
  GROUP BY
    test_category, test_type
  ORDER BY
    test_category`,
      {
        replacements: { patientId: params.id, status, categoryId, panelId },
        model: LabTest,
        type: QueryTypes.SELECT,
        mapToModel: true,
      },
    );

    const formattedData = results.map(x => renameObjectKeys(x.forResponse()));

    res.send({
      count: results.length,
      data: formattedData,
    });
  }),
);

patientRelations.use(patientProfilePicture);
patientRelations.use(patientDeath);
patientRelations.use(patientSecondaryIdRoutes);
