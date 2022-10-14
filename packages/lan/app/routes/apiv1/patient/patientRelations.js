import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';

import { getPatientAdditionalData } from 'shared/utils';
import { PATIENT_FIELD_DEFINITION_STATES } from 'shared/constants/patientFields';

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
    // if you change this, also look in ./patientFieldDefinition.js
    const { params } = req;
    req.checkPermission('read', 'Patient');
    const values = await req.db.query(
      `
        SELECT
          d.id AS "definitionId",
          d.name AS name,
          v.value AS value,
          c.name AS category
        FROM patient_field_definitions d
        LEFT JOIN patient_field_definition_categories c
          ON d.category_id = c.id
            AND d.state NOT IN (:disallowedStates)
        LEFT JOIN LATERAL (
          SELECT value
          FROM patient_field_values v
          WHERE v.definition_id = d.id
            AND patient_id = :patientId
          -- TODO: order by logical clock
          ORDER BY updated_at DESC LIMIT 1
        ) v ON true
        ORDER BY category ASC, name ASC;
      `,
      {
        replacements: {
          patientId: params.id,
          disallowedStates: [PATIENT_FIELD_DEFINITION_STATES.HISTORICAL],
        },
        type: QueryTypes.SELECT,
      },
    );
    res.send({
      count: values.length,
      data: values,
    });
  }),
);

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
