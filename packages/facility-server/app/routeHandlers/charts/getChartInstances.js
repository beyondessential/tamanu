import asyncHandler from 'express-async-handler';
import { QueryTypes } from 'sequelize';
import { subject } from '@casl/ability';
import { CHARTING_DATA_ELEMENT_IDS } from '@tamanu/constants';

export const fetchChartInstances = (options = {}) =>
  asyncHandler(async (req, res) => {
    const {
      permissionAction = 'read',
    } = options;

    const { db, params, models } = req;
    const { id: encounterId, patientId, chartSurveyId } = params;

    if (!encounterId && !patientId) {
      throw new Error('Either encounterId or patientId must be provided');
    }

    req.checkPermission(permissionAction, subject('Charting', { id: chartSurveyId }));

    const survey = await models.Survey.findByPk(chartSurveyId);
    const isChartLinkedToProgramRegistry = survey?.programId != null;

    let encounterFilter;
    let currentEncounterEndDate = null;
    let encounterPatientId = patientId;

    if (encounterId) {
      const currentEncounter = await models.Encounter.findByPk(encounterId);
      if (!currentEncounter) {
        throw new Error(`Encounter with id ${encounterId} not found`);
      }
      encounterPatientId = currentEncounter.patientId;

      if (isChartLinkedToProgramRegistry) {
        // Chart is linked to program registry: show instances from current and future encounters
        if (currentEncounter.endDate) {
          currentEncounterEndDate = currentEncounter.endDate;
          encounterFilter = `
            e.patient_id = :encounterPatientId 
            AND e.end_date <= :currentEncounterEndDate
            AND e.deleted_at IS NULL
          `;
        } else {
          encounterFilter = `
            e.patient_id = :encounterPatientId 
            AND e.deleted_at IS NULL
          `;
        }
      } else {
        // Chart is NOT linked to program registry: only show in the encounter where created
        encounterFilter = 'sr.encounter_id = :encounterId';
      }
    } else {
      encounterFilter = 'e.patient_id = :patientId AND e.deleted_at IS NULL';
    }

    const results = await db.query(
      `
        WITH chart_instances AS (
          SELECT
            sr.id AS "chartInstanceId",
            sr.survey_id AS "chartSurveyId",
            MAX(CASE WHEN sra.data_element_id = :complexChartInstanceNameElementId THEN sra.body END) AS "chartInstanceName",
            MAX(CASE WHEN sra.data_element_id = :complexChartDateElementId THEN sra.body END) AS "chartDate",
            MAX(CASE WHEN sra.data_element_id = :complexChartTypeElementId THEN sra.body END) AS "chartType",
            MAX(CASE WHEN sra.data_element_id = :complexChartSubtypeElementId THEN sra.body END) AS "chartSubtype"
          FROM
            survey_responses sr
          LEFT JOIN
            survey_response_answers sra
          ON
            sr.id = sra.response_id
          JOIN encounters e ON sr.encounter_id = e.id
          WHERE
            sr.survey_id = :chartSurveyId AND
            ${encounterFilter} AND
            sr.deleted_at IS NULL
          GROUP BY
            sr.id
        )

        SELECT
          *
        FROM chart_instances
        ORDER BY "chartDate" DESC;
      `,
      {
        replacements: {
          chartSurveyId,
          encounterId,
          patientId,
          encounterPatientId,
          currentEncounterEndDate,
          complexChartInstanceNameElementId: CHARTING_DATA_ELEMENT_IDS.complexChartInstanceName,
          complexChartDateElementId: CHARTING_DATA_ELEMENT_IDS.complexChartDate,
          complexChartTypeElementId: CHARTING_DATA_ELEMENT_IDS.complexChartType,
          complexChartSubtypeElementId: CHARTING_DATA_ELEMENT_IDS.complexChartSubtype,
        },
        type: QueryTypes.SELECT,
      },
    );
    
    res.send({
      count: results.length,
      data: results,
    });
  });
