import asyncHandler from 'express-async-handler';
import { QueryTypes, Sequelize } from 'sequelize';

import { getPatientAdditionalData } from 'shared/utils';
import { HIDDEN_VISIBILITY_STATUSES } from 'shared/constants/importable';

import { simpleGetList, permissionCheckingRouter, runPaginatedQuery } from '../crudHelpers';
import { patientSecondaryIdRoutes } from './patientSecondaryId';
import { patientDeath } from './patientDeath';
import { patientProfilePicture } from './patientProfilePicture';

export const patientRelations = permissionCheckingRouter('read', 'Patient');

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
        LEFT JOIN LATERAL (
          SELECT value
          FROM patient_field_values v
          WHERE v.definition_id = d.id
            AND v.patient_id = :patientId
          -- TODO: order by logical clock
          ORDER BY updated_at DESC LIMIT 1
        ) v ON true
        WHERE d.visibility_status NOT IN (:hiddenStatuses);
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
    const { order = 'desc', orderBy = 'date' } = query;
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
    const { surveyId, surveyType = 'programs', order = 'desc', orderBy = 'endTime' } = query;
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
        ORDER BY ${sortKey} ${sortDirection}
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

patientRelations.use(patientProfilePicture);
patientRelations.use(patientDeath);
patientRelations.use(patientSecondaryIdRoutes);
